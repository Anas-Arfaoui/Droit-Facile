import { apiRequest } from "./client";
import type { User } from "./auth";

export async function listClients(): Promise<User[]> {
  return apiRequest<User[]>("/users/clients");
}

export async function listUsers(): Promise<User[]> {
  return apiRequest<User[]>("/users");
}

export async function updateUserStatus(id: string | number, actif: boolean): Promise<User> {
  return apiRequest<User>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ actif }),
  });
}
