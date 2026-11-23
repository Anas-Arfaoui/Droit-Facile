import { apiRequest } from "./client";

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

export function listClauses(contractId: number): Promise<ClauseAnalysis> {
  return apiRequest<ClauseAnalysis>(`/contrats/${contractId}/clauses`);
}

export function analyzeContract(contractId: number): Promise<ClauseAnalysis> {
  return apiRequest<ClauseAnalysis>(`/contrats/${contractId}/analyse`, { method: "POST" });
}
