package com.droitfacile.dossier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class DossierDtos {

    public record CreateRequest(
            @NotBlank String titre,
            String description,
            @NotNull Long clientId
    ) {
    }

    public record UpdateRequest(
            @NotBlank String titre,
            String description
    ) {
    }

    public record StatutRequest(
            @NotNull StatutDossier statut
    ) {
    }

    public record Response(
            Long id,
            String titre,
            String description,
            StatutDossier statut,
            Long avocatId,
            String avocatNom,
            Long clientId,
            String clientNom,
            LocalDateTime creeLe,
            String partageToken,
            boolean partageActif
    ) {
        public static Response from(Dossier d) {
            return new Response(
                    d.getId(),
                    d.getTitre(),
                    d.getDescription(),
                    d.getStatut(),
                    d.getAvocat().getId(),
                    d.getAvocat().getNom(),
                    d.getClient().getId(),
                    d.getClient().getNom(),
                    d.getCreeLe(),
                    d.getPartageToken(),
                    d.isPartageActif()
            );
        }
    }
}
