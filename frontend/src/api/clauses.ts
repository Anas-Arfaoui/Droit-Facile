import { ApiError, apiRequest } from "./client";

export type ClauseType =
  | "DUREE"
  | "PAIEMENT"
  | "RESILIATION"
  | "PENALITE"
  | "CONFIDENTIALITE"
  | "RESPONSABILITE"
  | "JURIDICTION"
  | "AUTRE";

export type RiskLevel = "FAIBLE" | "MOYEN" | "ELEVE";

export const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  DUREE: "Durée",
  PAIEMENT: "Paiement",
  RESILIATION: "Résiliation",
  PENALITE: "Pénalités",
  CONFIDENTIALITE: "Confidentialité",
  RESPONSABILITE: "Responsabilité",
  JURIDICTION: "Juridiction",
  AUTRE: "Autre",
};

export type Clause = {
  id: number;
  type: ClauseType;
  titre: string;
  extrait: string;
  extraitVerifie: boolean;
  explication: string;
  niveauRisque: RiskLevel;
  motifRisque: string;
};

export type ClauseAnalysis = {
  contratId: number;
  avertissement: string;
  nombreClauses: number;
  nombreARisqueEleve: number;
  clauses: Clause[];
};

/** Lance (ou relance) l'analyse IA : peut durer 10 à 30 secondes. */
export function analyzeContract(contratId: number): Promise<ClauseAnalysis> {
  return apiRequest<ClauseAnalysis>("/contrats/" + contratId + "/analyse", { method: "POST" });
}

/** Dernières clauses déjà extraites (liste vide si aucune analyse n'a été lancée). */
export function listClauses(contratId: number): Promise<ClauseAnalysis> {
  return apiRequest<ClauseAnalysis>("/contrats/" + contratId + "/clauses");
}

/** Message lisible pour l'utilisateur à partir d'une erreur de l'API. */
export function describeClauseError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return "L'IA n'est pas configurée : la clé GEMINI_API_KEY est absente du serveur.";
    }
    if (error.status === 429) {
      return "Quota Gemini atteint : réessaie dans une minute.";
    }
    if (error.status === 401 || error.status === 403) {
      return "Session expirée ou accès refusé : reconnecte-toi.";
    }
    return error.message;
  }
  return "Erreur inattendue pendant l'analyse.";
}
