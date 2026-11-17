import { loginUser, logoutUser, registerUser, type Role } from "@/api/auth";

export async function registerAccount(
  email: string,
  password: string,
  displayName: string,
  _origin: string,
  role: Role = "CLIENT",
) {
  await registerUser({
    nom: displayName.trim(),
    email,
    motDePasse: password,
    role,
  });

  await loginUser({
    email,
    motDePasse: password,
  });

  return "signed-in";
}

export async function signOutAccount(queryClient: {
  cancelQueries: () => Promise<void>;
  clear: () => void;
}) {
  await queryClient.cancelQueries();
  queryClient.clear();
  logoutUser();
}
