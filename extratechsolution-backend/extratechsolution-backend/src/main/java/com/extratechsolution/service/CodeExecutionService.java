package com.extratechsolution.service;

import com.extratechsolution.enums.SubmissionStatus;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeExecutionService {

    private static final long TIMEOUT_SECONDS = 5;
    private static final boolean IS_WINDOWS =
            System.getProperty("os.name").toLowerCase().contains("win");

    // Prefer a PUBLIC class name (Java requires the filename to match it
    // exactly); fall back to any class name if there's no public one; fall
    // back to "Main" only if neither pattern is found at all.
    private static final Pattern PUBLIC_CLASS_PATTERN = Pattern.compile("public\\s+class\\s+(\\w+)");
    private static final Pattern ANY_CLASS_PATTERN = Pattern.compile("class\\s+(\\w+)");

    public static class ExecutionOutcome {
        public SubmissionStatus status;
        public int totalTestCases;
        public int passedTestCases;
        public String failureDetail;
        public long executionTimeMs;
    }

    public ExecutionOutcome runAgainstTestCases(
            String code, String language, List<TestCasePair> testCases
    ) {
        Path workDir = null;
        ExecutionOutcome outcome = new ExecutionOutcome();
        outcome.totalTestCases = testCases.size();
        outcome.passedTestCases = 0;

        try {
            workDir = Files.createTempDirectory("codeforge-exec-" + UUID.randomUUID());
            String entryPointName = writeSourceFile(workDir, language, code);

            String compileError = compile(workDir, language, entryPointName);
            if (compileError != null) {
                outcome.status = SubmissionStatus.COMPILE_ERROR;
                outcome.failureDetail = compileError;
                return outcome;
            }

            long startTime = System.currentTimeMillis();

            for (int i = 0; i < testCases.size(); i++) {
                TestCasePair testCase = testCases.get(i);
                RunResult result = run(workDir, language, entryPointName, testCase.input);

                if (result.timedOut) {
                    if (outcome.failureDetail == null) {
                        outcome.failureDetail = "Test " + (i + 1) + ": Time Limit Exceeded";
                    }
                    continue;
                }

                if (result.exitCode != 0) {
                    if (outcome.failureDetail == null) {
                        outcome.failureDetail = "Test " + (i + 1) + ": Runtime Error — " + result.stderr;
                    }
                    continue;
                }

                if (normalize(result.stdout).equals(normalize(testCase.expectedOutput))) {
                    outcome.passedTestCases++;
                } else if (outcome.failureDetail == null) {
                    outcome.failureDetail = "Test " + (i + 1) + ": expected \"" + testCase.expectedOutput
                            + "\" but got \"" + result.stdout.trim() + "\"";
                }
            }

            outcome.executionTimeMs = System.currentTimeMillis() - startTime;

            outcome.status = outcome.passedTestCases == outcome.totalTestCases
                    ? SubmissionStatus.ACCEPTED
                    : SubmissionStatus.WRONG_ANSWER;
            return outcome;

        } catch (Exception e) {
            outcome.status = SubmissionStatus.RUNTIME_ERROR;
            outcome.failureDetail = "Execution error: " + e.getMessage();
            return outcome;
        } finally {
            if (workDir != null) {
                deleteDirectoryQuietly(workDir.toFile());
            }
        }
    }

    public RunResult runOnce(String code, String language, String stdin) {
        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("codeforge-run-" + UUID.randomUUID());
            String entryPointName = writeSourceFile(workDir, language, code);

            String compileError = compile(workDir, language, entryPointName);
            if (compileError != null) {
                RunResult result = new RunResult();
                result.stderr = compileError;
                result.exitCode = -1;
                return result;
            }

            return run(workDir, language, entryPointName, stdin);
        } catch (Exception e) {
            RunResult result = new RunResult();
            result.stderr = "Execution error: " + e.getMessage();
            result.exitCode = -1;
            return result;
        } finally {
            if (workDir != null) {
                deleteDirectoryQuietly(workDir.toFile());
            }
        }
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().replaceAll("\\r\\n", "\n");
    }

    // Returns the "entry point name" used downstream: for Java this is the
    // detected class name (also used as the .java filename and in the
    // `java -cp . <name>` run command); for other languages it's unused by
    // callers but returned anyway for a uniform method signature.
    private String writeSourceFile(Path workDir, String language, String code) throws IOException {
        String fileName;
        String entryPointName = null;

        switch (language) {
            case "Java" -> {
                entryPointName = detectJavaClassName(code);
                fileName = entryPointName + ".java";
            }
            case "Python" -> fileName = "solution.py";
            case "JavaScript" -> fileName = "solution.js";
            case "C" -> fileName = "solution.c";
            case "C++" -> fileName = "solution.cpp";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        }

        Files.writeString(workDir.resolve(fileName), code, StandardCharsets.UTF_8);
        return entryPointName;
    }

    private String detectJavaClassName(String code) {
        Matcher publicMatch = PUBLIC_CLASS_PATTERN.matcher(code);
        if (publicMatch.find()) {
            return publicMatch.group(1);
        }
        Matcher anyMatch = ANY_CLASS_PATTERN.matcher(code);
        if (anyMatch.find()) {
            return anyMatch.group(1);
        }
        return "Main";
    }

    private String compile(Path workDir, String language, String entryPointName)
            throws IOException, InterruptedException {
        List<String> command = switch (language) {
            case "Java" -> List.of("javac", entryPointName + ".java");
            case "C" -> List.of("gcc", "solution.c", "-o", exeName("solution"));
            case "C++" -> List.of("g++", "solution.cpp", "-o", exeName("solution"));
            case "Python", "JavaScript" -> null; // interpreted — nothing to compile
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };

        if (command == null) return null;

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(false);
        Process process = pb.start();

        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            return "Compilation timed out.";
        }

        return process.exitValue() != 0 ? stderr : null;
    }

    private RunResult run(Path workDir, String language, String entryPointName, String stdin)
            throws IOException, InterruptedException {
        List<String> command = switch (language) {
            case "Java" -> List.of("java", "-cp", ".", entryPointName);
            case "Python" -> List.of("python", "solution.py");
            case "JavaScript" -> List.of("node", "solution.js");
            case "C" -> List.of(workDir.resolve(exeName("solution")).toString());
            case "C++" -> List.of(workDir.resolve(exeName("solution")).toString());
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workDir.toFile());
        Process process = pb.start();

        if (stdin != null) {
            process.getOutputStream().write(stdin.getBytes(StandardCharsets.UTF_8));
            process.getOutputStream().flush();
            process.getOutputStream().close();
        }

        String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);

        boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        RunResult result = new RunResult();
        if (!finished) {
            process.destroyForcibly();
            result.timedOut = true;
            return result;
        }

        result.exitCode = process.exitValue();
        result.stdout = stdout;
        result.stderr = stderr;
        return result;
    }

    private String exeName(String base) {
        return IS_WINDOWS ? base + ".exe" : "./" + base;
    }

    private void deleteDirectoryQuietly(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                deleteDirectoryQuietly(f);
            }
        }
        dir.delete();
    }

    public static class RunResult {
        public String stdout = "";
        public String stderr = "";
        public int exitCode;
        public boolean timedOut;
    }

    public static class TestCasePair {
        public String input;
        public String expectedOutput;

        public TestCasePair(String input, String expectedOutput) {
            this.input = input;
            this.expectedOutput = expectedOutput;
        }
    }
}