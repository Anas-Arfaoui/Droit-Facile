import { apiBlob, apiRequest } from "./client";
import type { Role } from "./auth";

export type RegistrationRequest = {
  id: number;
  nom: string;
  email: string;
  role: Role;
  status: "EN_ATTENTE" | "APPROUVEE" | "REFUSEE";
  avocatNom?: string;
  avocatId?: number;
  officialRecords?: string;
  correspondenceRecords?: string;
  contractFileName?: string;
  numeroAffaire?: string;
  hasContractFile: boolean;
  creeLe: string;
  motifRefus?: string;
};

export async function listRegistrationRequests() {
  return apiRequest<RegistrationRequest[]>("/registration-requests");
}

export async function approveRegistrationRequest(id: number) {
  return apiRequest(`/registration-requests/${id}/approve`, { method: "POST" });
}

export async function rejectRegistrationRequest(id: number, motif: string) {
  return apiRequest<RegistrationRequest>(`/registration-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ motif }),
  });
}

export async function downloadRegistrationContract(id: number) {
  return apiBlob(`/registration-requests/${id}/contract`);
}
