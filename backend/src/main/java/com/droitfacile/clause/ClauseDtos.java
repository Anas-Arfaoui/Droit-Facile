package com.droitfacile.clause;

import java.util.List;

public class ClauseDtos {

    public static final String AVERTISSEMENT =
            "Analyse generee par une IA : elle peut contenir des erreurs ou des oublis. "
                    + "L'avocat doit verifier chaque clause avant de s'y fier ou de la partager.";

    public record Response(Long id, TypeClause type, String titre, String extrait, boolean extraitVerifie,
                           String explication, NiveauRisque niveauRisque, String motifRisque) {
        public static Response from(Clause c) {
            return new Response(c.getId(), c.getType(), c.getTitre(), c.getExtrait(), c.isExtraitVerifie(),
                    c.getExplication(), c.getNiveauRisque(), c.getMotifRisque());
        }
    }

    public record Analyse(Long contratId, String avertissement, int nombreClauses, long nombreARisqueEleve,
                          List<Response> clauses) {
        public static Analyse de(Long contratId, List<Clause> clauses) {
            List<Response> liste = clauses.stream().map(Response::from).toList();
            long eleve = liste.stream().filter(r -> r.niveauRisque() == NiveauRisque.ELEVE).count();
            return new Analyse(contratId, AVERTISSEMENT, liste.size(), eleve, liste);
        }
    }
}
