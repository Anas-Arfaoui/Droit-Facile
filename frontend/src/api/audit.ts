import { apiRequest } from "./client";

export type AuditLog = {
  id: number;
  utilisateur: string;
  action: string;
  entite: string | null;
  entiteId: number | null;
  dateAction: string;
};

export function listAuditLogs(): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>("/audit");
}