package com.droitfacile.seance;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class SeanceDtos {

    public record CreateRequest(@NotNull LocalDateTime dateSeance, String notes) {
    }

    public record Response(Long id, Long dossierId, LocalDateTime dateSeance, String notes) {
        public static Response from(Seance s) {
            return new Response(s.getId(), s.getDossier().getId(), s.getDateSeance(), s.getNotes());
        }
    }
}
