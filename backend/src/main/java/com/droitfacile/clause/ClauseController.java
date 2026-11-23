package com.droitfacile.clause;

import com.droitfacile.clause.ClauseDtos.Analyse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contrats")
public class ClauseController {

    private final ClauseService service;

    public ClauseController(ClauseService service) {
        this.service = service;
    }

    /** Lance (ou relance) l'analyse IA du contrat. */
    @PostMapping("/{id}/analyse")
    @PreAuthorize("hasAnyRole('AVOCAT', 'ADMIN')")
    public Analyse analyser(@PathVariable Long id, Authentication auth) {
        return service.analyser(id, auth.getName());
    }

    /** Dernieres clauses extraites pour ce contrat. */
    @GetMapping("/{id}/clauses")
    @PreAuthorize("hasAnyRole('AVOCAT', 'ADMIN')")
    public Analyse clauses(@PathVariable Long id, Authentication auth) {
        return service.lister(id, auth.getName());
    }
}
