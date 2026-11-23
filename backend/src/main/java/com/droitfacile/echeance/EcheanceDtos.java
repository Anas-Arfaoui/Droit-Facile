package com.droitfacile.echeance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EcheanceDtos {

    public record CreateRequest(
            @NotBlank String titre,
            String description,
            @NotNull LocalDate dateEcheance,
            @NotNull @Min(0) @Max(365) Integer rappelJoursAvant
    ) {
    }

    public record UpdateRequest(
            @NotBlank String titre,
            String description,
            @NotNull LocalDate dateEcheance,
            @NotNull @Min(0) @Max(365) Integer rappelJoursAvant,
            @NotNull StatutEcheance statut
    ) {
    }

    public record StatutRequest(
            @NotNull StatutEcheance statut
    ) {
    }

    public record Response(
            Long id,
            Long dossierId,
            String titre,
            String description,
            LocalDate dateEcheance,
            Integer rappelJoursAvant,
            StatutEcheance statut,
            LocalDateTime creeLe,
            LocalDateTime modifieLe
    ) {
        public static Response from(Echeance echeance) {
            return new Response(
                    echeance.getId(),
                    echeance.getDossier().getId(),
                    echeance.getTitre(),
                    echeance.getDescription(),
                    echeance.getDateEcheance(),
                    echeance.getRappelJoursAvant(),
                    echeance.getStatut(),
                    echeance.getCreeLe(),
                    echeance.getModifieLe()
            );
        }
    }
}