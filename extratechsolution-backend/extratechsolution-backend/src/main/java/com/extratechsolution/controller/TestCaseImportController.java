package com.extratechsolution.controller;

import com.extratechsolution.service.TestCaseImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/problems/admin")
@RequiredArgsConstructor
public class TestCaseImportController {

    private final TestCaseImportService importService;

    @PostMapping("/{problemId}/test-cases/bulk-import")
    public ResponseEntity<?> importZip(
            @PathVariable Long problemId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "replaceExisting", defaultValue = "false") boolean replaceExisting
    ) {
        try {
            return ResponseEntity.ok(importService.importZip(problemId, file, replaceExisting));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test-cases/sample-zip")
    public ResponseEntity<byte[]> sampleZip() throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(bos)) {
            add(zos, "1.in", "1 2\n");
            add(zos, "1.out", "3\n");
            add(zos, "2.in", "10 20\n");
            add(zos, "2.out", "30\n");
            add(zos, "3.in", "100 250\n");
            add(zos, "3.out", "350\n");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"test-cases-sample.zip\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(bos.toByteArray());
    }

    private void add(ZipOutputStream zos, String name, String content) throws IOException {
        zos.putNextEntry(new ZipEntry(name));
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }
}