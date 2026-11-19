
package com.droitfacile.document;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DocumentController {

    private final DocumentService documentService;

    @Value("${app.storage.dir:./uploads}")
    private String storageDir;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/dossiers/{dossierId}/documents")
    public ResponseEntity<Document> upload(
            @PathVariable Long dossierId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        Document document = documentService.upload(
                dossierId, file, authentication.getName());

        return ResponseEntity.ok(document);
    }

    @GetMapping("/dossiers/{dossierId}/documents")
    public ResponseEntity<List<Document>> getDocuments(
            @PathVariable Long dossierId,
            Authentication authentication) {

        return ResponseEntity.ok(
                documentService.getDocuments(dossierId, authentication.getName()));
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            Authentication authentication) throws Exception {

        Document document = documentService.getDocument(
                id, authentication.getName());

        Path path = Paths.get(storageDir).toAbsolutePath().normalize()
                .resolve(document.getNomStocke()).normalize();

        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = document.getTypeFichier() != null
                ? document.getTypeFichier()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + document.getNomFichier() + "\"")
                .body(resource);
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        documentService.delete(id, authentication.getName());

        return ResponseEntity.noContent().build();
    }
}
