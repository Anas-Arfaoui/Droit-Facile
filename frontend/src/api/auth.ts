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
};

export const AUTH_CHANGED_EVENT = "lawyer-up-auth-changed";

export type AuthResponse = {
  user: User;
  token: string;
};

type RegisterRequest = {
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
};
type LoginRequest = {
  email: string;
  motDePasse: string;
};

export async function registerUser(data: RegisterRequest): Promise<User> {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
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
