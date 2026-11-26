import { useQuery } from "@tanstack/react-query";
import { Activity, FolderOpen, ShieldCheck } from "lucide-react";

import { listAuditLogs } from "@/api/audit";
import { listDossiers } from "@/api/dossiers";

export function AdminDashboardPanel() {
  const dossiersQuery = useQuery({
    queryKey: ["admin-dossiers"],
    queryFn: listDossiers,
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit"],
    queryFn: listAuditLogs,
  });

  if (dossiersQuery.isLoading || auditQuery.isLoading) {
    return (
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Chargement du dashboard administrateur...
        </p>
      </section>
    );
  }

  if (dossiersQuery.isError || auditQuery.isError) {
    return (
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-destructive">
          Impossible de charger les données administrateur.
        </p>
      </section>
    );
  }

  const dossiers = dossiersQuery.data ?? [];
  const auditLogs = auditQuery.data ?? [];

  const ouverts = dossiers.filter(
    (dossier) => dossier.statut === "OUVERT" || dossier.statut === "EN_COURS",
  ).length;

  const clotures = dossiers.filter(
    (dossier) => dossier.statut === "CLOTURE",
  ).length;

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <h2 className="text-xl">Dashboard administrateur</h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm">Total dossiers</span>
          </div>
          <p className="mt-2 text-3xl font-semibold">{dossiers.length}</p>
        </div>

        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-muted-foreground">Dossiers actifs</p>
          <p className="mt-2 text-3xl font-semibold">{ouverts}</p>
        </div>

        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-muted-foreground">Dossiers clôturés</p>
          <p className="mt-2 text-3xl font-semibold">{clotures}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="font-medium">Dernières activités</h3>
        </div>

        {auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune activité enregistrée.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {auditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {log.utilisateur}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(log.dateAction).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}