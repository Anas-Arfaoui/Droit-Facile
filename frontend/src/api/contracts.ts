import { apiBlob, apiRequest } from "./client";

export type ContractLanguage = "FR" | "AR" | "MIXTE" | "INCONNUE";

export type Contract = {
  id: number;
  dossierId: number;
  nomFichier: string;
  typeFichier: "pdf" | "docx";
  tailleOctets: number;
  langue: ContractLanguage;
  ocrNecessaire: boolean;
  nombreCaracteres: number;
  importePar: string;
  importeLe: string;
};

export type ContractDetail = {
  contrat: Contract;
  texte: string | null;
};

export function listContracts(dossierId: number): Promise<Contract[]> {
  return apiRequest<Contract[]>("/dossiers/" + dossierId + "/contrats");
}

export function uploadContract(dossierId: number, file: File): Promise<Contract> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<Contract>("/dossiers/" + dossierId + "/contrats", {
    method: "POST",
    body: form,
  });
}

export function getContract(id: number): Promise<ContractDetail> {
  return apiRequest<ContractDetail>("/contrats/" + id);
}

export function downloadContract(id: number): Promise<Blob> {
  return apiBlob("/contrats/" + id + "/fichier");
}
