import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Plus, Search } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { createDossier, listDossiers, type Dossier } from "@/api/dossiers";
import { listClients } from "@/api/users";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ReminderPanel } from "@/components/ReminderPanel";
import { AdminDashboardPanel } from "@/components/AdminDashboardPanel";
import { NotificationPanel } from "@/components/NotificationPanel";

const PROGRESS_STEPS = 4;

function statusProgress(status: Dossier["statut"]): number {
  switch (status) {
    case "OUVERT":
      return 0;
    case "EN_COURS":
      return 1;
    case "EN_ATTENTE":
      return 2;
    case "CLOTURE":
      return 3;
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Droit-Facile — Dossiers du cabinet" },
      {
        name: "description",
        content: "Gestion des dossiers du cabinet.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const canCreate = user?.role === "AVOCAT" || user?.role === "ADMIN";
  const [q, setQ] = useState("");

  const dossiersQuery = useQuery({
    queryKey: ["dossiers"],
    queryFn: listDossiers,
  });

  const dossiers = dossiersQuery.data ?? [];
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
    enabled: showCreate && canCreate,
  });

  const filteredDossiers = dossiers.filter((dossier) =>
    `${dossier.id} ${dossier.titre} ${dossier.clientNom}`.toLowerCase().includes(q.toLowerCase()),
  );

  async function handleCreateDossier(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !clientId || createBusy) return;

    setCreateBusy(true);
    setCreateError("");

    try {
      await createDossier({
        titre: title.trim(),
        description: description.trim() || undefined,
        clientId: Number(clientId),
      });

      setTitle("");
      setDescription("");
      setClientId("");
      setShowCreate(false);
      await dossiersQuery.refetch();
    } catch {
      setCreateError("Impossible de créer le dossier.");
    } finally {
      setCreateBusy(false);
    }
  }
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {user?.role === "ADMIN" && <AdminDashboardPanel />}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">{t("dossiers")}</h1>
            <p className="mt-1 text-muted-foreground">{t("ruleBanner")}</p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t("newDossier")}
            </button>
          )}
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreateDossier}
            className="mb-6 space-y-4 rounded-lg border border-border bg-card p-5"
          >
            <h2 className="text-xl">Nouveau dossier</h2>

            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titre du dossier"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />

            <select
              required
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
              {clientsQuery.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom} — {client.email}
                </option>
              ))}
            </select>

            {clientsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Chargement des clients...</p>
            )}

            {clientsQuery.isError && (
              <p className="text-sm text-destructive">Impossible de charger les clients.</p>
            )}

            {createError && (
              <p role="alert" className="text-sm text-destructive">
                {createError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createBusy || clientsQuery.isLoading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {createBusy ? "Création..." : "Créer le dossier"}
              </button>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-input px-4 py-2 text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("search")}
            className="w-full rounded-md border border-input bg-card py-2.5 pe-3 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
            <NotificationPanel enabled={canCreate} />
            <ReminderPanel enabled={canCreate} />

        {dossiersQuery.isLoading && (
          <p className="text-muted-foreground">Chargement des dossiers...</p>
        )}

        {dossiersQuery.isError && (
          <p role="alert" className="text-destructive">
            Impossible de charger les dossiers.
          </p>
        )}

        {!dossiersQuery.isLoading && !dossiersQuery.isError && filteredDossiers.length === 0 && (
          <p className="text-muted-foreground">Aucun dossier trouvé.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredDossiers.map((dossier) => {
            const progress = statusProgress(dossier.statut);

            return (
              <Link
                key={dossier.id}
                to="/dossiers/$id"
                params={{ id: String(dossier.id) }}
                className="group rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{dossier.id}</p>

                    <h2 className="mt-1 text-xl">{dossier.clientNom}</h2>

                    <p className="text-sm text-muted-foreground">{dossier.titre}</p>
                  </div>

                  <FolderOpen className="h-5 w-5 text-accent" />
                </div>

                <div className="mt-5 flex gap-1">
                  {Array.from({ length: PROGRESS_STEPS }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 flex-1 rounded-full ${
                        index <= progress ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{dossier.statut}</span>

                  <span>
                    {t("updated")} {new Date(dossier.creeLe).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
