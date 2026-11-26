import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test";

const apiBaseUrl = `${process.env.E2E_API_URL ?? "http://127.0.0.1:8081/api"}/`.replace(
  /\/+/g,
  "/",
).replace("http:/", "http://");
const password = "Password123";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin12345";
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const lawyer = {
  email: `e2e-lawyer-${suffix}@test.local`,
  name: "E2E Lawyer",
};
const client = {
  email: `e2e-client-${suffix}@test.local`,
  name: "E2E Client",
};
const otherClient = {
  email: `e2e-other-client-${suffix}@test.local`,
  name: "E2E Other Client",
};
const dossierTitle = `Dossier E2E ${suffix}`;

let lawyerToken = "";
let clientToken = "";
let dossierId = 0;
let clientId = 0;

async function register(api: APIRequestContext, account: typeof lawyer, role: "AVOCAT" | "CLIENT") {
  const response = await api.post("auth/register", {
    data: {
      nom: account.name,
      email: account.email,
      motDePasse: password,
      role,
    },
  });
  if (!response.ok()) {
    throw new Error(`Registration failed (${response.status()}): ${await response.text()}`);
  }
}

async function login(api: APIRequestContext, email: string) {
  const response = await api.post("auth/login", {
      data: { email, motDePasse: email === "admin@droitfacile.com" ? adminPassword : password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email} (${response.status()}): ${await response.text()}`);
  }
  return (await response.json()).token as string;
}

async function loginInBrowser(page: Page, email: string) {
  await page.goto("/auth");
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("textbox", { name: /^Mot de passe/ }).fill(
    email === "admin@droitfacile.com" ? adminPassword : password,
  );
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.beforeAll(async () => {
  const api = await request.newContext({ baseURL: apiBaseUrl });
  try {
    await register(api, lawyer, "AVOCAT");
    await register(api, client, "CLIENT");
    await register(api, otherClient, "CLIENT");
    lawyerToken = await login(api, lawyer.email);
    clientToken = await login(api, client.email);
    const clientsResponse = await api.get("users/clients", {
      headers: { Authorization: `Bearer ${lawyerToken}` },
    });
    expect(clientsResponse.ok()).toBeTruthy();
    const clients = await clientsResponse.json();
    clientId = clients.find((user: { email: string }) => user.email === client.email).id;

    const dossierResponse = await api.post("dossiers", {
      headers: { Authorization: `Bearer ${lawyerToken}` },
      data: {
        titre: dossierTitle,
        description: "Dossier créé par les tests E2E",
        clientId,
      },
    });
    expect(dossierResponse.ok()).toBeTruthy();
    dossierId = (await dossierResponse.json()).id;

    const adminToken = await login(api, "admin@droitfacile.com");
    const notificationResponse = await api.post("notifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        destinataireId: clientId,
        titre: "Notification E2E",
        message: "Notification visible dans le tableau de bord.",
      },
    });
    if (!notificationResponse.ok()) {
      throw new Error(`Notification setup failed (${notificationResponse.status()}): ${await notificationResponse.text()}`);
    }
  } finally {
    await api.dispose();
  }
});

test("login and role permissions are enforced in the UI", async ({ page }) => {
  await loginInBrowser(page, lawyer.email);
  await expect(page.getByRole("button", { name: "Nouveau dossier" })).toBeVisible();

  await loginInBrowser(page, client.email);
  await expect(page.getByRole("button", { name: "Nouveau dossier" })).toHaveCount(0);
  await expect(page.getByText(dossierTitle)).toBeVisible();

  await page.goto("/auth");
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel("Adresse e-mail").fill("admin@droitfacile.com");
  await page.getByRole("textbox", { name: /^Mot de passe/ }).fill(adminPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("complementary").getByText("Administration")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nouveau dossier" })).toHaveCount(0);
});

test("dossier access, échéance management, notifications and PDF download work", async ({ page }) => {
  await loginInBrowser(page, lawyer.email);
  await page.getByText(dossierTitle).click();
  await expect(page).toHaveURL(new RegExp(`/dossiers/${dossierId}$`));

  await page.getByPlaceholder("Titre").last().fill("Audience E2E");
  await page.getByPlaceholder("Description facultative").fill("Échéance créée par E2E");
  await page.locator('input[type="date"]').last().fill("2030-01-15");
  await page.getByRole("button", { name: /Ajouter l.échéance/ }).click();
  await expect(page.getByText("Audience E2E")).toBeVisible();

  await page.getByRole("button", { name: "Résumé" }).click();
  await page.getByRole("button", { name: "Valider le résumé" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter en PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`dossier-${dossierId}.pdf`);

  await loginInBrowser(page, client.email);
  await expect(page.getByText(dossierTitle)).toBeVisible();
  await expect(page.getByText("Notification E2E")).toBeVisible();
  await page.getByText(dossierTitle).click();
  await expect(page.getByText("Audience E2E")).toBeVisible();
});

test("admin dashboard exposes the notification menu", async ({ page }) => {
  await page.goto("/auth");
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel("Adresse e-mail").fill("admin@droitfacile.com");
  await page.getByRole("textbox", { name: /^Mot de passe/ }).fill(adminPassword);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("button", { name: /Notifications/ }).last().click();
  await expect(page.getByRole("heading", { name: "Notifications" }).last()).toBeVisible();
  await expect(page.getByPlaceholder("Titre de la notification")).toBeVisible();
  await expect(page.getByPlaceholder("Message")).toBeVisible();
});
