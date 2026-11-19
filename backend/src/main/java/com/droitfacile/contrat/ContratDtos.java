package com.droitfacile.contrat;

import java.time.LocalDateTime;

public class ContratDtos {

    /** Informations du contrat, sans le texte complet. */
    public record Response(Long id, Long dossierId, String nomFichier, String typeFichier,
                           long tailleOctets, LangueContrat langue, boolean ocrNecessaire,
                           int nombreCaracteres, String importePar, LocalDateTime importeLe) {
        public static Response from(Contrat c) {
            return new Response(c.getId(), c.getDossier().getId(), c.getNomFichier(), c.getTypeFichier(),
                    c.getTailleOctets(), c.getLangue(), c.isOcrNecessaire(),
                    c.getTexte() == null ? 0 : c.getTexte().length(),
                    c.getImportePar(), c.getImporteLe());
        }
    }

    /** Contrat avec le texte extrait. */
    public record Detail(Response contrat, String texte) {
    }
}
