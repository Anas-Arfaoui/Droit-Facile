package com.droitfacile.echeance;

import com.droitfacile.echeance.EcheanceDtos.CreateRequest;
import com.droitfacile.echeance.EcheanceDtos.Response;
import com.droitfacile.echeance.EcheanceDtos.StatutRequest;
import com.droitfacile.echeance.EcheanceDtos.UpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class EcheanceController {

    private final EcheanceService service;

    public EcheanceController(EcheanceService service) {
        this.service = service;
    }

    @GetMapping("/dossiers/{dossierId}/echeances")
    public List<Response> list(
            @PathVariable Long dossierId,
            Authentication auth
    ) {
        return service.list(dossierId, auth.getName());
    }

    @PostMapping("/dossiers/{dossierId}/echeances")
    @PreAuthorize("hasRole('AVOCAT')")
    public ResponseEntity<Response> create(
            @PathVariable Long dossierId,
            @Valid @RequestBody CreateRequest request,
            Authentication auth
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(dossierId, request, auth.getName()));
    }

    @GetMapping("/echeances/{id}")
    public Response get(
            @PathVariable Long id,
            Authentication auth
    ) {
        return service.get(id, auth.getName());
    }

    @PutMapping("/echeances/{id}")
    @PreAuthorize("hasRole('AVOCAT')")
    public Response update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequest request,
            Authentication auth
    ) {
        return service.update(id, request, auth.getName());
    }

    @PatchMapping("/echeances/{id}/statut")
    @PreAuthorize("hasRole('AVOCAT')")
    public Response changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatutRequest request,
            Authentication auth
    ) {
        return service.changeStatus(id, request.statut(), auth.getName());
    }

    @DeleteMapping("/echeances/{id}")
    @PreAuthorize("hasRole('AVOCAT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            Authentication auth
    ) {
        service.delete(id, auth.getName());
    }
}
