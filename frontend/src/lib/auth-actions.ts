import { loginUser, logoutUser, registerUser, type RegisterRequest, type Role } from "@/api/auth";

export async function registerAccount(
  email: string,
  password: string,
  displayName: string,
  _origin: string,
  role: Role = "CLIENT",
  details: Omit<RegisterRequest, "nom" | "email" | "motDePasse" | "role"> = {},
) {
  await registerUser({
    nom: displayName.trim(),
    email,
    motDePasse: password,
    role,
    ...details,
  });
  return "pending-review";
}

export async function signOutAccount(queryClient: {
  cancelQueries: () => Promise<void>;
  clear: () => void;
}) {
  await queryClient.cancelQueries();
  queryClient.clear();
  logoutUser();
}
