import { apiRequest } from "./client";

export type DossierStatus = "OUVERT" | "EN_COURS" | "EN_ATTENTE" | "CLOTURE";

export type Dossier = {
  id: number;
  titre: string;
  description: string | null;
  statut: DossierStatus;
  avocatId: number;
  avocatNom: string;
  clientId: number;
  clientNom: string;
  creeLe: string;
};

export type Seance = {
  id: number;
  dossierId: number;
  dateSeance: string;
  notes: string | null;
};

export type CreateDossierRequest = {
  titre: string;
  description?: string;
  clientId: number;
};

export type UpdateDossierRequest = {
  titre: string;
  description?: string;
};

export async function listDossiers(): Promise<Dossier[]> {
  return apiRequest<Dossier[]>("/dossiers");
}

export async function getDossier(id: number): Promise<Dossier> {
  return apiRequest<Dossier>(`/dossiers/${id}`);
}

export async function createDossier(data: CreateDossierRequest): Promise<Dossier> {
  return apiRequest<Dossier>("/dossiers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDossier(id: number, data: UpdateDossierRequest): Promise<Dossier> {
  return apiRequest<Dossier>(`/dossiers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateDossierStatus(id: number, statut: DossierStatus): Promise<Dossier> {
  return apiRequest<Dossier>(`/dossiers/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
}

export async function listSeances(id: number): Promise<Seance[]> {
  return apiRequest<Seance[]>(`/dossiers/${id}/seances`);
}

export async function createSeance(
  dossierId: number,
  dateSeance: string,
  notes?: string,
): Promise<Seance> {
  return apiRequest<Seance>(`/dossiers/${dossierId}/seances`, {
    method: "POST",
    body: JSON.stringify({
      dateSeance,
      notes,
    }),
  });
}
