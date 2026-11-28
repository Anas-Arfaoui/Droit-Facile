import { apiRequest, clearAuthToken, setAuthToken } from "./client";

export type Role = "CLIENT" | "AVOCAT" | "ADMIN";

export type User = {
  id: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  actif?: boolean;
};

export const AUTH_CHANGED_EVENT = "lawyer-up-auth-changed";

export type AuthResponse = {
  user: User;
  token: string;
};

export type RegisterRequest = {
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
  avocatNom?: string;
  avocatId?: number;
  officialRecords?: string;
  correspondenceRecords?: string;
  numeroAffaire?: string;
  contractFile?: File;
};
export type RegistrationResponse = { id: number; nom: string; email: string; role: Role; status: string };
type LoginRequest = {
  email: string;
  motDePasse: string;
};

export async function registerUser(data: RegisterRequest): Promise<RegistrationResponse> {
  const { contractFile, ...requestData } = data;
  const form = new FormData();
  form.append("data", new Blob([JSON.stringify(requestData)], { type: "application/json" }));
  if (contractFile) form.append("contractFile", contractFile);
  return apiRequest<RegistrationResponse>("/auth/register", {
    method: "POST",
    body: form,
  });
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setAuthToken(response.token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  return response;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/users/me");
}

export function logoutUser(): void {
  clearAuthToken();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}
