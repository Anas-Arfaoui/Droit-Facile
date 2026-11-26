import { apiRequest } from "./client";
import type { User } from "./auth";

export async function listClients(): Promise<User[]> {
  return apiRequest<User[]>("/users/clients");
}

export async function listUsers(): Promise<User[]> {
  return apiRequest<User[]>("/users");
}
