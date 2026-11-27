import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { listReminders } from "@/api/echeances";

export function ReminderPanel({ enabled = true }: { enabled?: boolean }) {
  const remindersQuery = useQuery({
    queryKey: ["deadline-reminders", 30],
    queryFn: () => listReminders(30),
    enabled,
  });

  if (!enabled) return null;

  if (remindersQuery.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Chargement des rappels...</p>
      </section>
    );
  }

  if (remindersQuery.isError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-destructive">Impossible de charger les rappels.</p>
      </section>
    );
  }

  const reminders = remindersQuery.data ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-accent" />
        <h2 className="text-xl">Rappels d'échéances</h2>
      </div>

      {reminders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucune échéance urgente ou proche.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reminders.map((reminder) => (
            <article
              key={reminder.id}
              className={`rounded-xl border p-4 ${
                reminder.enRetard ? "border-destructive/40 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                {reminder.enRetard && <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />}

                <div className="flex-1">
                  <p className="font-medium">{reminder.titre}</p>

                  <p className="text-sm text-muted-foreground">
                    {reminder.dossierTitre} — {reminder.clientNom}
                  </p>

                  <p className="mt-1 text-sm">
                    Échéance : {new Date(`${reminder.dateEcheance}T00:00:00`).toLocaleDateString()}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      reminder.enRetard ? "font-medium text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {reminder.enRetard
                      ? "Échéance en retard"
                      : `Rappel prévu ${reminder.rappelJoursAvant} jour(s) avant`}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
