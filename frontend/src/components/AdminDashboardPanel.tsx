import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { listAuditLogs } from "@/api/audit";
import { listDossiers } from "@/api/dossiers";
import { createNotification, listNotifications } from "@/api/notifications";
import { listUsers, updateUserStatus } from "@/api/users";
import { approveRegistrationRequest, downloadRegistrationContract, listRegistrationRequests, rejectRegistrationRequest } from "@/api/registration-requests";

type AdminSection = "dashboard" | "requests" | "users" | "dossiers" | "notifications" | "activity";

export function AdminDashboardPanel() {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [destinataireId, setDestinataireId] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("TOUS");
  const [dossierSearch, setDossierSearch] = useState("");
  const [dossierStatus, setDossierStatus] = useState("TOUS");
  const [activitySearch, setActivitySearch] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("TOUTES");
  const [requestBusy, setRequestBusy] = useState<number | null>(null);
  const [requestError, setRequestError] = useState("");
  const [accountBusy, setAccountBusy] = useState<string | null>(null);

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
  const requestsQuery = useQuery({ queryKey: ["admin-registration-requests"], queryFn: listRegistrationRequests });

  if (
    dossiersQuery.isLoading ||
    auditQuery.isLoading ||
    usersQuery.isLoading ||
    notificationsQuery.isLoading ||
    requestsQuery.isLoading
  ) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
    notificationsQuery.isError ||
    requestsQuery.isError
  ) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((request) => request.status === "EN_ATTENTE");

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !search || `${user.nom} ${user.email}`.toLowerCase().includes(search);
      return matchesSearch && (userRole === "TOUS" || user.role === userRole);
    });
  }, [users, userRole, userSearch]);

  const filteredDossiers = useMemo(() => {
    const search = dossierSearch.trim().toLowerCase();
    return dossiers.filter((dossier) => {
      const matchesSearch = !search || `${dossier.titre} ${dossier.clientNom} ${dossier.avocatNom}`.toLowerCase().includes(search);
      return matchesSearch && (dossierStatus === "TOUS" || dossier.statut === dossierStatus);
    });
  }, [dossiers, dossierSearch, dossierStatus]);

  const filteredNotifications = notifications.filter((notification) =>
    notificationFilter === "TOUTES" || (notificationFilter === "NON_LUES" ? !notification.lu : notification.lu),
  );

  const filteredActivity = auditLogs.filter((log) => {
    const search = activitySearch.trim().toLowerCase();
    return !search || `${log.action} ${log.utilisateur}`.toLowerCase().includes(search);
  });

  async function refreshAll() {
    await Promise.all([
      dossiersQuery.refetch(),
      auditQuery.refetch(),
      usersQuery.refetch(),
      notificationsQuery.refetch(),
      requestsQuery.refetch(),
    ]);
  }

  async function handleApproveRequest(id: number) {
    setRequestBusy(id); setRequestError("");
    try { await approveRegistrationRequest(id); await Promise.all([requestsQuery.refetch(), usersQuery.refetch()]); }
    catch { setRequestError("Impossible d'approuver cette demande."); }
    finally { setRequestBusy(null); }
  }

  async function handleRejectRequest(id: number) {
    const motif = window.prompt("Motif du refus (facultatif) :") ?? "";
    setRequestBusy(id); setRequestError("");
    try { await rejectRegistrationRequest(id, motif); await requestsQuery.refetch(); }
    catch { setRequestError("Impossible de refuser cette demande."); }
    finally { setRequestBusy(null); }
  }

  async function handleDownloadContract(id: number, fileName?: string) {
    const blob = await downloadRegistrationContract(id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = fileName || "contrat-inscription"; link.click();
    URL.revokeObjectURL(url);
  }

  async function handleToggleAccount(userId: string, actif: boolean) {
    setAccountBusy(userId);
    try {
      await updateUserStatus(userId, !actif);
      await usersQuery.refetch();
    } finally {
      setAccountBusy(null);
    }
  }

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
    <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex min-h-[420px] flex-col md:flex-row">
        <aside className="w-full border-b border-border bg-sidebar p-4 text-sidebar-foreground md:w-64 md:border-b-0 md:border-e">
          <div className="mb-6 flex items-center gap-2 px-2">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
            <span className="font-semibold">Administration</span>
          </div>

          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:block md:space-y-1">
            <button
              type="button"
              onClick={() => setSection("dashboard")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
              onClick={() => setSection("requests")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                section === "requests" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span className="flex-1 text-start">Demandes</span>
              <span>{pendingRequests.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setSection("users")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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

              <div className="mt-4 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs leading-5 text-sidebar-foreground/70">
                <p className="font-medium text-sidebar-foreground">Droits admin</p>
                <p className="mt-1">Consultation des dossiers et création de notifications internes. La création de dossiers reste réservée aux avocats.</p>
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex-1 p-5 md:p-7">
          {section === "dashboard" && (
            <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Centre de contrôle</p>
                <h2 className="text-2xl font-semibold">Vue d'ensemble</h2>
              </div>
              <button type="button" onClick={() => void refreshAll()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                <RefreshCw className="h-4 w-4" /> Actualiser
              </button>
            </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-sm text-muted-foreground">
                    Total dossiers
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiers.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-sm text-muted-foreground">
                    Dossiers actifs
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiersActifs}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-sm text-muted-foreground">
                    Dossiers clôturés
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {dossiersClotures}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <button type="button" onClick={() => setSection("users")} className="rounded-xl border border-border p-4 text-start transition hover:bg-muted/50">
                  <p className="font-medium">Gérer les utilisateurs</p>
                  <p className="mt-1 text-sm text-muted-foreground">Rechercher par rôle ou identité.</p>
                </button>
                <button type="button" onClick={() => setSection("dossiers")} className="rounded-xl border border-border p-4 text-start transition hover:bg-muted/50">
                  <p className="font-medium">Consulter les dossiers</p>
                  <p className="mt-1 text-sm text-muted-foreground">Filtrer par statut, client ou avocat.</p>
                </button>
                <button type="button" onClick={() => setSection("notifications")} className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-start transition hover:bg-primary/10">
                  <p className="font-medium">Créer une notification</p>
                  <p className="mt-1 text-sm text-muted-foreground">Envoyer un message interne ciblé.</p>
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-primary/5 p-5">
                <h3 className="font-medium">État du système</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les services principaux sont accessibles et les données
                  d'audit sont disponibles.
                </p>
              </div>
            </>
          )}

          {section === "requests" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Validation administrative</p>
                <h2 className="text-2xl font-semibold">Demandes d'inscription</h2>
                <p className="mt-1 text-sm text-muted-foreground">Vérifiez les informations avant de créer un compte actif.</p>
              </div>
              {requestError && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{requestError}</p>}
              {pendingRequests.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune demande en attente.</p> : pendingRequests.map((request) => (
                <article key={request.id} className="rounded-xl border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{request.nom}</h3><p className="text-sm text-muted-foreground">{request.email} · {request.role}</p><p className="mt-1 text-xs text-muted-foreground">Demande du {new Date(request.creeLe).toLocaleString("fr-FR")}</p></div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">EN ATTENTE</span>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-2">
                    {request.role === "AVOCAT" ? <><div><p className="font-medium">Documents officiels</p><p className="text-muted-foreground">{request.officialRecords || "Non renseigné"}</p></div><div><p className="font-medium">Correspondance</p><p className="text-muted-foreground">{request.correspondenceRecords || "Non renseigné"}</p></div></> : <><div><p className="font-medium">Avocat référent</p><p className="text-muted-foreground">{request.avocatNom || "Non renseigné"} {request.avocatId ? `(ID ${request.avocatId})` : ""}</p></div><div><p className="font-medium">Numéro d'affaire</p><p className="text-muted-foreground">{request.numeroAffaire || "Non fourni"}</p></div></>}
                    <div><p className="font-medium">Contrat / accord</p>{request.hasContractFile ? <button type="button" onClick={() => void handleDownloadContract(request.id, request.contractFileName)} className="text-primary hover:underline">Télécharger {request.contractFileName}</button> : <p className="text-muted-foreground">Aucun fichier</p>}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={requestBusy === request.id} onClick={() => void handleRejectRequest(request.id)} className="rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">Refuser</button><button type="button" disabled={requestBusy === request.id} onClick={() => void handleApproveRequest(request.id)} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{requestBusy === request.id ? "Traitement..." : "Approuver et créer le compte"}</button></div>
                </article>
              ))}
            </div>
          )}

          {section === "users" && (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Administration</p>
                <h2 className="text-2xl font-semibold">Utilisateurs</h2>
              </div>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Rechercher par nom ou email" className="w-full rounded-lg border border-input bg-background py-2.5 ps-9 pe-3 text-sm" />
                </label>
                <select value={userRole} onChange={(event) => setUserRole(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                  <option value="TOUS">Tous les rôles</option>
                  <option value="ADMIN">Administrateurs</option>
                  <option value="AVOCAT">Avocats</option>
                  <option value="CLIENT">Clients</option>
                </select>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{filteredUsers.length} utilisateur(s) affiché(s) sur {users.length}</p>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nom</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                      <th className="px-4 py-3 font-medium">État</th>
                      <th className="px-4 py-3 text-end font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{user.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.role === "ADMIN" ? "bg-amber-100 text-amber-800" : user.role === "AVOCAT" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.actif === false ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {user.actif === false ? "Désactivé" : "Actif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <button
                            type="button"
                            disabled={accountBusy === String(user.id) || user.role === "ADMIN"}
                            onClick={() => void handleToggleAccount(String(user.id), user.actif !== false)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${user.actif === false ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-red-300 text-red-700 hover:bg-red-50"}`}
                            title={user.role === "ADMIN" ? "Les comptes administrateurs ne sont pas désactivables ici" : undefined}
                          >
                            {accountBusy === String(user.id) ? "..." : user.actif === false ? "Activer" : "Désactiver"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucun utilisateur ne correspond aux filtres.</p>}
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

              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={dossierSearch} onChange={(event) => setDossierSearch(event.target.value)} placeholder="Rechercher un dossier, client ou avocat" className="w-full rounded-lg border border-input bg-background py-2.5 ps-9 pe-3 text-sm" />
                </label>
                <select value={dossierStatus} onChange={(event) => setDossierStatus(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                  <option value="TOUS">Tous les statuts</option>
                  <option value="OUVERT">Ouverts</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="CLOTURE">Clôturés</option>
                </select>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">Consultation uniquement · {filteredDossiers.length} dossier(s) affiché(s)</p>

              <div className="space-y-3">
                {filteredDossiers.map((dossier) => (
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
                    <Link to="/dossiers/$id" params={{ id: String(dossier.id) }} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                      Ouvrir le dossier →
                    </Link>
                  </article>
                ))}
              </div>
              {filteredDossiers.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucun dossier ne correspond aux filtres.</p>}
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

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{notifications.length} notification(s) au total</p>
                <select value={notificationFilter} onChange={(event) => setNotificationFilter(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="TOUTES">Toutes</option>
                  <option value="NON_LUES">Non lues</option>
                  <option value="LUES">Lues</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune notification.</p>
                ) : (
                  filteredNotifications.map((notification) => (
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

              <label className="relative mb-4 block">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Rechercher une action ou un utilisateur" className="w-full rounded-lg border border-input bg-background py-2.5 ps-9 pe-3 text-sm" />
              </label>

              {filteredActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune activité enregistrée.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredActivity.slice(0, 20).map((log) => (
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
