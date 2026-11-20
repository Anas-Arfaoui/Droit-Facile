import { apiBlob, apiRequest } from "./client";

export type DocumentFile = {
  id: number;
  dossierId: number;
  nomFichier: string;
  typeFichier: string;
  tailleOctets: number;
  envoyeLe: string;
  envoyeurNom: string;
};

export async function listDocuments(dossierId: number): Promise<DocumentFile[]> {
  return apiRequest<DocumentFile[]>(`/dossiers/${dossierId}/documents`);
}

export async function uploadDocument(
  dossierId: number,
  file: File,
): Promise<DocumentFile> {
  const form = new FormData();
  form.append("file", file);

  return apiRequest<DocumentFile>(`/dossiers/${dossierId}/documents`, {
    method: "POST",
    body: form,
  });
}

export async function downloadDocument(id: number): Promise<Blob> {
  return apiBlob(`/documents/${id}/download`);
}

export async function deleteDocument(id: number): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, {
    method: "DELETE",
  });
}