import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Clock3, FolderOpen, Plus, Search, X } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { createDossier, listDossiers, type Dossier } from "@/api/dossiers";
import { listClients } from "@/api/users";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ReminderPanel } from "@/components/ReminderPanel";
import { AdminDashboardPanel } from "@/components/AdminDashboardPanel";

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

  const canCreate = user?.role === "AVOCAT";
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
  const activeDossiers = dossiers.filter((dossier) => dossier.statut !== "CLOTURE").length;
  const closedDossiers = dossiers.filter((dossier) => dossier.statut === "CLOTURE").length;

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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-sidebar px-6 py-8 text-sidebar-foreground shadow-sm sm:px-10 sm:py-10">
          <div className="absolute -end-16 -top-20 h-56 w-56 rounded-full bg-sidebar-primary/10 blur-2xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">
                {user.role === "ADMIN" ? "Administration" : "Espace cabinet"}
              </p>
              <h1 className="text-4xl leading-tight sm:text-5xl">{t("dossiers")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-sidebar-foreground/70 sm:text-base">
                {t("ruleBanner")}
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-sidebar-primary px-4 py-3 text-sm font-semibold text-sidebar-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                {t("newDossier")}
              </button>
            )}
          </div>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Résumé de l'activité">
          {[
            { label: "Total des dossiers", value: dossiers.length, icon: BriefcaseBusiness, tone: "text-primary" },
            { label: "Dossiers actifs", value: activeDossiers, icon: Clock3, tone: "text-accent-foreground" },
            { label: "Dossiers clôturés", value: closedDossiers, icon: CheckCircle2, tone: "text-success" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-muted ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          ))}
        </section>

        {user?.role === "ADMIN" && <AdminDashboardPanel />}

        {showCreate && (
          <form
            onSubmit={handleCreateDossier}
            className="relative mb-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Création</p>
                <h2 className="mt-1 text-2xl">Nouveau dossier</h2>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block space-y-1.5 text-sm font-medium">
              Titre du dossier
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Litige commercial"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(facultatif)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ajoutez quelques informations utiles..."
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              Client
              <select
                required
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner un client</option>
                {clientsQuery.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom} — {client.email}
                  </option>
                ))}
              </select>
            </label>

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

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={createBusy || clientsQuery.isLoading}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
              >
                {createBusy ? "Création..." : "Créer le dossier"}
              </button>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {user?.role !== "ADMIN" && (
          <>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t("search")}
              className="w-full rounded-xl border border-input bg-card py-3 pe-3 ps-10 text-sm shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filteredDossiers.length}</span> dossier(s)</p>
        </div>
        <div className="mb-8">
          <ReminderPanel enabled={canCreate} />
        </div>

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

        <div className="grid gap-5 md:grid-cols-2">
          {filteredDossiers.map((dossier) => {
            const progress = statusProgress(dossier.statut);

            return (
              <Link
                key={dossier.id}
                to="/dossiers/$id"
                params={{ id: String(dossier.id) }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{dossier.id}</p>

                    <h2 className="mt-1 text-xl font-semibold">{dossier.clientNom}</h2>

                    <p className="text-sm text-muted-foreground">{dossier.titre}</p>
                  </div>

                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FolderOpen className="h-5 w-5" />
                  </span>
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

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">{dossier.statut}</span>

                  <span>
                    {t("updated")} {new Date(dossier.creeLe).toLocaleDateString()}
                  </span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>
          </>
        )}
      </main>
    </div>
  );
}
