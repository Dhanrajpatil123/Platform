package com.extratechsolution.service;

import com.extratechsolution.dto.TestCaseImportResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.TestCase;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@RequiredArgsConstructor
public class TestCaseImportService {

    private static final int MAX_PAIRS = 300;
    private static final int MAX_ENTRIES = 2000;
    private static final long MAX_ENTRY_BYTES = 1024L * 1024L;
    private static final long MAX_TOTAL_BYTES = 50L * 1024L * 1024L;

    private static final Set<String> IN_EXT = Set.of("in", "input", "inp");
    private static final Set<String> OUT_EXT = Set.of("out", "output", "ans", "sol");
    private static final Set<String> TEXT_EXT = Set.of("txt", "dat", "data", "");

    private static final Pattern IN_TOKEN =
            Pattern.compile("(^|[^a-z])(inputs?|inp|in)(?=[^a-z]|$)");
    private static final Pattern OUT_TOKEN =
            Pattern.compile("(^|[^a-z])(outputs?|out|answers?|ans|sol)(?=[^a-z]|$)");
    private static final Pattern CHUNK = Pattern.compile("\\d+|\\D+");

    private static final Comparator<String> NATURAL = (a, b) -> {
        Matcher ma = CHUNK.matcher(a);
        Matcher mb = CHUNK.matcher(b);
        while (ma.find() && mb.find()) {
            String x = ma.group();
            String y = mb.group();
            int c = (Character.isDigit(x.charAt(0)) && Character.isDigit(y.charAt(0)))
                    ? new BigInteger(x).compareTo(new BigInteger(y))
                    : x.compareTo(y);
            if (c != 0) return c;
        }
        return a.length() - b.length();
    };

    private enum Kind { INPUT, OUTPUT }

    private record Classified(Kind kind, String key) {}

    private record FileEntry(String path, String content) {}

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    @Transactional
    public TestCaseImportResponse importZip(Long problemId, MultipartFile file, boolean replaceExisting) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found."));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose a ZIP file to upload.");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase(Locale.ROOT).endsWith(".zip")) {
            throw new IllegalArgumentException("Please upload a .zip file.");
        }

        Map<String, FileEntry> inputs = new LinkedHashMap<>();
        Map<String, FileEntry> outputs = new LinkedHashMap<>();
        List<String> warnings = new ArrayList<>();

        readZip(file, inputs, outputs, warnings);

        for (Map.Entry<String, FileEntry> e : inputs.entrySet()) {
            if (!outputs.containsKey(e.getKey())) {
                warnings.add("No matching output file for \"" + e.getValue().path() + "\" — skipped.");
            }
        }
        for (Map.Entry<String, FileEntry> e : outputs.entrySet()) {
            if (!inputs.containsKey(e.getKey())) {
                warnings.add("No matching input file for \"" + e.getValue().path() + "\" — skipped.");
            }
        }

        List<String> keys = inputs.keySet().stream()
                .filter(outputs::containsKey)
                .sorted(NATURAL)
                .toList();

        if (keys.isEmpty()) {
            throw new IllegalArgumentException(
                    "No input/output pairs found. Name files like 1.in + 1.out, "
                            + "input1.txt + output1.txt, or input/1.txt + output/1.txt.");
        }
        if (keys.size() > MAX_PAIRS) {
            throw new IllegalArgumentException(
                    "Too many test cases (" + keys.size() + "). The limit is " + MAX_PAIRS + " per ZIP.");
        }

        int deletedExisting = 0;
        Set<String> seen = new HashSet<>();
        if (replaceExisting) {
            deletedExisting = testCaseRepository.findByProblemId(problemId).size();
            testCaseRepository.deleteByProblemId(problemId);
        } else {
            for (TestCase existing : testCaseRepository.findByProblemId(problemId)) {
                seen.add(signature(normalize(existing.getInput()), normalize(existing.getExpectedOutput())));
            }
        }

        List<TestCase> toSave = new ArrayList<>();
        int skippedDuplicates = 0;
        int skippedInvalid = 0;

        for (String key : keys) {
            FileEntry in = inputs.get(key);
            FileEntry out = outputs.get(key);
            String input = normalize(in.content());
            String expected = normalize(out.content());

            if (expected.isBlank()) {
                warnings.add("\"" + out.path() + "\" has an empty expected output — skipped.");
                skippedInvalid++;
                continue;
            }
            if (!seen.add(signature(input, expected))) {
                skippedDuplicates++;
                continue;
            }
            toSave.add(buildTestCase(problem, input, expected));
        }

        testCaseRepository.saveAll(toSave);

        int totalNow = testCaseRepository.findByProblemId(problemId).size();
        return new TestCaseImportResponse(
                keys.size(), toSave.size(), skippedDuplicates, skippedInvalid,
                deletedExisting, totalNow, warnings);
    }

    // The only place that touches the TestCase entity's shape.
    private TestCase buildTestCase(Problem problem, String input, String expectedOutput) {
        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setInput(input);
        testCase.setExpectedOutput(expectedOutput);
        return testCase;
    }

    private String signature(String input, String expected) {
        return input + "\u0000" + expected;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String v = value;
        if (v.startsWith("\uFEFF")) v = v.substring(1);
        return v.replace("\r\n", "\n").replace("\r", "\n").stripTrailing();
    }

    private void readZip(MultipartFile file,
                         Map<String, FileEntry> inputs,
                         Map<String, FileEntry> outputs,
                         List<String> warnings) {
        long[] totalBytes = {0};
        int entryCount = 0;

        try (ZipInputStream zis = new ZipInputStream(file.getInputStream(), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (++entryCount > MAX_ENTRIES) {
                    throw new IllegalArgumentException("The ZIP contains too many files.");
                }
                if (entry.isDirectory()) continue;

                String path = entry.getName().replace('\\', '/');
                String lower = path.toLowerCase(Locale.ROOT);
                String fileName = lower.substring(lower.lastIndexOf('/') + 1);

                byte[] bytes = readEntry(zis, totalBytes);

                if (lower.startsWith("__macosx/") || fileName.isEmpty() || fileName.startsWith(".")) {
                    continue; // OS metadata, ignore silently
                }
                if (bytes == null) {
                    warnings.add("\"" + path + "\" is larger than 1 MB — skipped.");
                    continue;
                }

                Classified classified = classify(lower);
                if (classified == null) {
                    warnings.add("Ignored \"" + path + "\" (could not tell if it is an input or an output file).");
                    continue;
                }

                Map<String, FileEntry> target = classified.kind() == Kind.INPUT ? inputs : outputs;
                if (target.containsKey(classified.key())) {
                    warnings.add("\"" + path + "\" duplicates \""
                            + target.get(classified.key()).path() + "\" — skipped.");
                    continue;
                }
                target.put(classified.key(),
                        new FileEntry(path, new String(bytes, StandardCharsets.UTF_8)));
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the ZIP file. Is it corrupted?");
        }
    }

    // Returns null when an entry is over the per-file limit (it is still drained so the total is counted).
    private byte[] readEntry(ZipInputStream zis, long[] totalBytes) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        boolean tooLarge = false;
        int n;
        while ((n = zis.read(buffer)) != -1) {
            totalBytes[0] += n;
            if (totalBytes[0] > MAX_TOTAL_BYTES) {
                throw new IllegalArgumentException("The ZIP is too large once unpacked (limit 50 MB).");
            }
            if (!tooLarge) {
                if (out.size() + n > MAX_ENTRY_BYTES) {
                    tooLarge = true;
                } else {
                    out.write(buffer, 0, n);
                }
            }
        }
        return tooLarge ? null : out.toByteArray();
    }

    private Classified classify(String lowerPath) {
        String fileName = lowerPath.substring(lowerPath.lastIndexOf('/') + 1);
        int dot = fileName.lastIndexOf('.');
        String ext = dot >= 0 ? fileName.substring(dot + 1) : "";
        String noExt = dot >= 0 ? lowerPath.substring(0, lowerPath.length() - ext.length() - 1) : lowerPath;

        boolean hasInToken = IN_TOKEN.matcher(noExt).find();
        boolean hasOutToken = OUT_TOKEN.matcher(noExt).find();

        Kind kind;
        if (IN_EXT.contains(ext)) {
            kind = Kind.INPUT;
        } else if (OUT_EXT.contains(ext)) {
            kind = Kind.OUTPUT;
        } else if (TEXT_EXT.contains(ext) && hasInToken != hasOutToken) {
            kind = hasInToken ? Kind.INPUT : Kind.OUTPUT;
        } else {
            return null;
        }

        String key = IN_TOKEN.matcher(noExt).replaceFirst("$1");
        key = OUT_TOKEN.matcher(key).replaceFirst("$1");
        key = key.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        return new Classified(kind, key.isEmpty() ? "single" : key);
    }
}