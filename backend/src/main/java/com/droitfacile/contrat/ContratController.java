package com.droitfacile.contrat;

import com.droitfacile.contrat.ContratDtos.Detail;
import com.droitfacile.contrat.ContratDtos.Response;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ContratController {

    private static final MediaType DOCX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final ContratService service;

    public ContratController(ContratService service) {
        this.service = service;
    }

    @PostMapping(value = "/dossiers/{dossierId}/contrats", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('AVOCAT')")
    public ResponseEntity<Response> importer(@PathVariable Long dossierId,
                                             @RequestParam("file") MultipartFile file,
                                             Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.importer(dossierId, file, auth.getName()));
    }

    @GetMapping("/dossiers/{dossierId}/contrats")
    @PreAuthorize("hasRole('AVOCAT')")
    public List<Response> lister(@PathVariable Long dossierId, Authentication auth) {
        return service.lister(dossierId, auth.getName());
    }

    @GetMapping("/contrats/{id}")
    @PreAuthorize("hasRole('AVOCAT')")
    public Detail detail(@PathVariable Long id, Authentication auth) {
        return service.detail(id, auth.getName());
    }

    @GetMapping("/contrats/{id}/fichier")
    @PreAuthorize("hasRole('AVOCAT')")
    public ResponseEntity<Resource> fichier(@PathVariable Long id, Authentication auth) {
        Contrat c = service.getOwned(id, auth.getName());
        MediaType type = "pdf".equals(c.getTypeFichier()) ? MediaType.APPLICATION_PDF : DOCX;
        String disposition = ContentDisposition.attachment()
                .filename(c.getNomFichier(), StandardCharsets.UTF_8).build().toString();
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(service.fichier(c));
    }
}
