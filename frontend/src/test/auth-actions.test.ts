import { beforeEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("@/api/auth", () => authApi);

import { registerAccount, signOutAccount } from "@/lib/auth-actions";

describe("Account authentication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers and signs in a new user", async () => {
    authApi.registerUser.mockResolvedValue({
      id: 1,
      nom: "Nom",
      email: "test@example.com",
      role: "CLIENT",
    });

    authApi.loginUser.mockResolvedValue({
      token: "test-token",
      id: 1,
      nom: "Nom",
      email: "test@example.com",
      role: "CLIENT",
    });

    const result = await registerAccount(
      "test@example.com",
      "password",
      " Nom ",
      "http://localhost:8081",
    );

    expect(result).toBe("signed-in");

    expect(authApi.registerUser).toHaveBeenCalledWith({
      nom: "Nom",
      email: "test@example.com",
      motDePasse: "password",
      role: "CLIENT",
    });

    expect(authApi.loginUser).toHaveBeenCalledWith({
      email: "test@example.com",
      motDePasse: "password",
    });
  });

  it("clears cached data before signing out", async () => {
    const order: string[] = [];

    authApi.logoutUser.mockImplementation(() => {
      order.push("logout");
    });

    await signOutAccount({
      cancelQueries: async () => {
        order.push("cancel");
      },
      clear: () => {
        order.push("clear");
      },
    });

    expect(order).toEqual(["cancel", "clear", "logout"]);
  });
});
