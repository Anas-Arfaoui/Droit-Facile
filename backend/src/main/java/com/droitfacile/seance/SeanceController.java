package com.droitfacile.seance;

import com.droitfacile.seance.SeanceDtos.CreateRequest;
import com.droitfacile.seance.SeanceDtos.Response;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dossiers/{dossierId}/seances")
public class SeanceController {

    private final SeanceService service;

    public SeanceController(SeanceService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('AVOCAT')")
    public ResponseEntity<Response> create(@PathVariable Long dossierId,
                                           @Valid @RequestBody CreateRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dossierId, req, auth.getName()));
    }

    @GetMapping
    public List<Response> list(@PathVariable Long dossierId, Authentication auth) {
        return service.list(dossierId, auth.getName());
    }
}
