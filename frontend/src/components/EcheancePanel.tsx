import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createEcheance,
  deleteEcheance,
  listEcheances,
  updateEcheanceStatus,
  type EcheanceStatus,
} from "@/api/echeances";

const statusLabels: Record<EcheanceStatus, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

export function EcheancePanel({ dossierId }: { dossierId: number }) {
  const { user } = useAuth();
  const isAvocat = user?.role === "AVOCAT" || user?.role === "ADMIN";

  const echeancesQuery = useQuery({
    queryKey: ["dossier-echeances", dossierId],
    queryFn: () => listEcheances(dossierId),
  });

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [rappelJoursAvant, setRappelJoursAvant] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    await echeancesQuery.refetch();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!titre.trim() || !dateEcheance || busy) return;

    setBusy(true);
    setError("");

    try {
      await createEcheance(dossierId, {
        titre: titre.trim(),
        description: description.trim() || undefined,
        dateEcheance,
        rappelJoursAvant: Number(rappelJoursAvant),
      });

      setTitre("");
      setDescription("");
      setDateEcheance("");
      setRappelJoursAvant("7");

      await refresh();
    } catch {
      setError("Impossible de créer l'échéance.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: number, statut: EcheanceStatus) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await updateEcheanceStatus(id, statut);
      await refresh();
    } catch {
      setError("Impossible de modifier le statut.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (busy) return;

    const confirmed = window.confirm("Supprimer cette échéance ?");
    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await deleteEcheance(id);
      await refresh();
    } catch {
      setError("Impossible de supprimer l'échéance.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl">Échéances</h2>
      </div>

      {isAvocat && (
        <form
          onSubmit={handleCreate}
          className="mt-4 space-y-3 rounded-md border border-border p-4"
        >
          <h3 className="font-medium">Ajouter une échéance</h3>

          <input
            required
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            placeholder="Titre"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description facultative"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Date d'échéance
              <input
                required
                type="date"
                value={dateEcheance}
                onChange={(event) => setDateEcheance(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="text-sm">
              Rappel, jours avant
              <input
                required
                min={0}
                max={365}
                type="number"
                value={rappelJoursAvant}
                onChange={(event) => setRappelJoursAvant(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Ajouter l'échéance
          </button>
        </form>
      )}

      {echeancesQuery.isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Chargement des échéances...</p>
      )}

      {echeancesQuery.isError && (
        <p className="mt-4 text-sm text-destructive">Impossible de charger les échéances.</p>
      )}

      {!echeancesQuery.isLoading &&
        !echeancesQuery.isError &&
        echeancesQuery.data?.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">Aucune échéance enregistrée.</p>
        )}

      <div className="mt-4 space-y-3">
        {echeancesQuery.data?.map((echeance) => (
          <article key={echeance.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <h3 className="font-medium">{echeance.titre}</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Échéance : {new Date(`${echeance.dateEcheance}T00:00:00`).toLocaleDateString()}
                </p>

                <p className="text-sm text-muted-foreground">
                  Rappel : {echeance.rappelJoursAvant} jour(s) avant
                </p>

                {echeance.description && <p className="mt-2 text-sm">{echeance.description}</p>}
              </div>

              <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                {statusLabels[echeance.statut]}
              </span>
            </div>

            {isAvocat && (
              <div className="mt-3 flex flex-wrap gap-2">
                {echeance.statut === "A_VENIR" && (
                  <button
                    type="button"
                    onClick={() => void changeStatus(echeance.id, "EN_COURS")}
                    disabled={busy}
                    className="rounded-md border border-input px-3 py-1.5 text-sm"
                  >
                    Démarrer
                  </button>
                )}

                {echeance.statut === "EN_COURS" && (
                  <button
                    type="button"
                    onClick={() => void changeStatus(echeance.id, "TERMINEE")}
                    disabled={busy}
                    className="rounded-md border border-input px-3 py-1.5 text-sm"
                  >
                    Marquer terminée
                  </button>
                )}

                {echeance.statut !== "TERMINEE" && echeance.statut !== "ANNULEE" && (
                  <button
                    type="button"
                    onClick={() => void changeStatus(echeance.id, "ANNULEE")}
                    disabled={busy}
                    className="rounded-md border border-input px-3 py-1.5 text-sm"
                  >
                    Annuler
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void remove(echeance.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
