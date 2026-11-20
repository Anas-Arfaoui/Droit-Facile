package com.droitfacile.document;

import java.time.LocalDateTime;

public final class DocumentDtos {

    private DocumentDtos() {
    }

    public record Response(
            Long id,
            Long dossierId,
            String nomFichier,
            String typeFichier,
            long tailleOctets,
            LocalDateTime envoyeLe,
            String envoyeurNom
    ) {
        public static Response from(Document document) {
            return new Response(
                    document.getId(),
                    document.getDossier().getId(),
                    document.getNomFichier(),
                    document.getTypeFichier(),
                    document.getTailleOctets(),
                    document.getEnvoyeLe(),
                    document.getEnvoyeur().getNom()
            );
        }
    }
}
