import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  FolderOpen,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { listAuditLogs } from "@/api/audit";
import { listDossiers } from "@/api/dossiers";
import { createNotification, listNotifications } from "@/api/notifications";
import { listUsers } from "@/api/users";

type AdminSection = "dashboard" | "users" | "dossiers" | "notifications" | "activity";

export function AdminDashboardPanel() {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [destinataireId, setDestinataireId] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");

  const dossiersQuery = useQuery({
    queryKey: ["admin-dossiers"],
    queryFn: listDossiers,
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit"],
    queryFn: listAuditLogs,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: listNotifications,
  });

  if (
    dossiersQuery.isLoading ||
    auditQuery.isLoading ||
    usersQuery.isLoading ||
    notificationsQuery.isLoading
  ) {
    return (
      <section className="mb-8 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Chargement du dashboard administrateur...
        </p>
      </section>
    );
  }

  if (
    dossiersQuery.isError ||
    auditQuery.isError ||
    usersQuery.isError ||
    notificationsQuery.isError
  ) {
    return (
      <section className="mb-8 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-destructive">
          Impossible de charger le dashboard administrateur.
        </p>
      </section>
    );
  }

  const dossiers = dossiersQuery.data ?? [];
  const auditLogs = auditQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  async function handleCreateNotification(event: React.FormEvent) {
    event.preventDefault();
    if (!destinataireId || !notificationTitle.trim() || !notificationMessage.trim()) return;

    setNotificationBusy(true);
    setNotificationError("");
    setNotificationSuccess("");

    try {
      await createNotification({
        destinataireId: Number(destinataireId),
        titre: notificationTitle.trim(),
        message: notificationMessage.trim(),
      });
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationSuccess("Notification créée avec succès.");
      await notificationsQuery.refetch();
    } catch {
      setNotificationError("Impossible de créer la notification.");
    } finally {
      setNotificationBusy(false);
    }
  }

  const dossiersActifs = dossiers.filter(
    (dossier) =>
      dossier.statut === "OUVERT" || dossier.statut === "EN_COURS",
  ).length;

  const dossiersClotures = dossiers.filter(
    (dossier) => dossier.statut === "CLOTURE",
  ).length;

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex min-h-[420px] flex-col md:flex-row">
        <aside className="w-full border-b border-border bg-sidebar p-4 text-sidebar-foreground md:w-60 md:border-b-0 md:border-e">
          <div className="mb-6 flex items-center gap-2 px-2">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
            <span className="font-semibold">Administration</span>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setSection("dashboard")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                section === "dashboard"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Vue d'ensemble
            </button>

            <button
              type="button"
              onClick={() => setSection("activity")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                section === "activity"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <Activity className="h-4 w-4" />
              Activité
            </button>

            <button
              type="button"
              onClick={() => setSection("users")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                section === "users"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="flex-1 text-start">Utilisateurs</span>
              <span>{users.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setSection("dossiers")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                section === "dossiers"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span className="flex-1 text-start">Dossiers</span>
              <span>{dossiers.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setSection("notifications")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                section === "notifications"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="flex-1 text-start">Notifications</span>
              <span>{notifications.length}</span>
            </button>

            <div className="mt-5 border-t border-sidebar-border pt-5">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/60">
                <FolderOpen className="h-4 w-4" />
                {dossiers.length} dossier(s)
              </div>

              <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/60">
                <Bell className="h-4 w-4" />
                {notifications.length} notification(s)
              </div>

              <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/60">
                <Users className="h-4 w-4" />
                {users.length} utilisateur(s)
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex-1 p-5 md:p-7">
          {section === "dashboard" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Vue d'ensemble</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-5">
                  <p className="text-sm text-muted-foreground">
                    Total dossiers
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiers.length}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-5">
                  <p className="text-sm text-muted-foreground">
                    Dossiers actifs
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiersActifs}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-5">
                  <p className="text-sm text-muted-foreground">
                    Dossiers clôturés
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiersClotures}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-border p-5">
                <h3 className="font-medium">État du système</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les services principaux sont accessibles et les données
                  d'audit sont disponibles.
                </p>
              </div>
            </>
          )}

          {section === "users" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Utilisateurs</h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nom</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{user.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === "dossiers" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Dossiers</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vue globale des dossiers et de leurs responsables.
                </p>
              </div>

              <div className="space-y-3">
                {dossiers.map((dossier) => (
                  <article key={dossier.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{dossier.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          Client : {dossier.clientNom} · Avocat : {dossier.avocatNom}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {dossier.statut}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {section === "notifications" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Notifications</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulte les notifications et envoie un message interne.
                </p>
              </div>

              <form onSubmit={handleCreateNotification} className="mb-6 space-y-3 rounded-lg border border-border p-4">
                <h3 className="font-medium">Créer une notification</h3>

                <select
                  required
                  value={destinataireId}
                  onChange={(event) => setDestinataireId(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choisir un destinataire</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nom} — {user.email} ({user.role})
                    </option>
                  ))}
                </select>

                <input
                  required
                  value={notificationTitle}
                  onChange={(event) => setNotificationTitle(event.target.value)}
                  placeholder="Titre de la notification"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                <textarea
                  required
                  value={notificationMessage}
                  onChange={(event) => setNotificationMessage(event.target.value)}
                  placeholder="Message"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                {notificationError && <p className="text-sm text-destructive">{notificationError}</p>}
                {notificationSuccess && <p className="text-sm text-success">{notificationSuccess}</p>}

                <button
                  type="submit"
                  disabled={notificationBusy}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {notificationBusy ? "Envoi..." : "Envoyer la notification"}
                </button>
              </form>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune notification.</p>
                ) : (
                  notifications.map((notification) => (
                    <article key={notification.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-medium">{notification.titre}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {notification.lu ? "Lue" : "Non lue"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}

          {section === "activity" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Activité récente</h2>
              </div>

              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune activité enregistrée.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.slice(0, 10).map((log) => (
                    <article
                      key={log.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.utilisateur}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {new Date(log.dateAction).toLocaleString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
