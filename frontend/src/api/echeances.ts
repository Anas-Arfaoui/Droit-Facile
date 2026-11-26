import { apiRequest } from "./client";

export type EcheanceStatus = "A_VENIR" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export type Echeance = {
  id: number;
  dossierId: number;
  titre: string;
  description: string | null;
  dateEcheance: string;
  rappelJoursAvant: number;
  statut: EcheanceStatus;
  creeLe: string;
  modifieLe: string | null;
};

export type CreateEcheanceRequest = {
  titre: string;
  description?: string;
  dateEcheance: string;
  rappelJoursAvant: number;
};

export type UpdateEcheanceRequest = {
  titre: string;
  description?: string;
  dateEcheance: string;
  rappelJoursAvant: number;
  statut: EcheanceStatus;
};

export function listEcheances(dossierId: number): Promise<Echeance[]> {
  return apiRequest<Echeance[]>(`/dossiers/${dossierId}/echeances`);
}

export function createEcheance(dossierId: number, data: CreateEcheanceRequest): Promise<Echeance> {
  return apiRequest<Echeance>(`/dossiers/${dossierId}/echeances`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEcheance(id: number, data: UpdateEcheanceRequest): Promise<Echeance> {
  return apiRequest<Echeance>(`/echeances/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateEcheanceStatus(id: number, statut: EcheanceStatus): Promise<Echeance> {
  return apiRequest<Echeance>(`/echeances/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
}

export async function deleteEcheance(id: number): Promise<void> {
  await apiRequest<void>(`/echeances/${id}`, {
    method: "DELETE",
  });
}
export type DeadlineReminder = {
  id: number;
  dossierId: number;
  dossierTitre: string;
  clientNom: string;
  titre: string;
  description: string | null;
  dateEcheance: string;
  rappelJoursAvant: number;
  statut: EcheanceStatus;
  enRetard: boolean;
};

export function listReminders(jours = 30): Promise<DeadlineReminder[]> {
  return apiRequest<DeadlineReminder[]>(`/echeances/rappels?jours=${jours}`);
}
