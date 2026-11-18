package com.droitfacile.dossier;

import com.droitfacile.dossier.DossierDtos.CreateRequest;
import com.droitfacile.dossier.DossierDtos.Response;
import com.droitfacile.dossier.DossierDtos.StatutRequest;
import com.droitfacile.dossier.DossierDtos.UpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dossiers")
public class DossierController {

    private final DossierService service;

    public DossierController(DossierService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('AVOCAT')")
    public ResponseEntity<Response> create(@Valid @RequestBody CreateRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req, auth.getName()));
    }

    @GetMapping
    public List<Response> list(Authentication auth) {
        return service.list(auth.getName());
    }

    @GetMapping("/{id}")
    public Response get(@PathVariable Long id, Authentication auth) {
        return service.get(id, auth.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AVOCAT')")
    public Response update(@PathVariable Long id, @Valid @RequestBody UpdateRequest req, Authentication auth) {
        return service.update(id, req, auth.getName());
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('AVOCAT')")
    public Response changeStatut(@PathVariable Long id, @Valid @RequestBody StatutRequest req, Authentication auth) {
        return service.changeStatut(id, req.statut(), auth.getName());
    }
    @PostMapping("/{id}/partage")
    @PreAuthorize("hasRole('AVOCAT')")
    public Response activateSharing(
            @PathVariable Long id,
            Authentication auth
    ) {
        return service.activateSharing(id, auth.getName());
    }

    @GetMapping("/partage/{token}")
    public Response shared(@PathVariable String token) {
        return service.getShared(token);
    }
}
