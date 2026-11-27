import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, ChevronDown } from "lucide-react";

import {
  listNotifications,
  markNotificationAsRead,
} from "@/api/notifications";

type NotificationPanelProps = {
  enabled?: boolean;
  variant?: "panel" | "header";
};

export function NotificationPanel({ enabled = true, variant = "panel" }: NotificationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled,
  });

  if (!enabled) return null;

  if (notificationsQuery.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Chargement des notifications...
        </p>
      </section>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-destructive">
          Impossible de charger les notifications.
        </p>
      </section>
    );
  }

  const notifications = notificationsQuery.data ?? [];
  const nonLues = notifications.filter((notification) => !notification.lu);
  const latestNotification = notifications[0];

  async function handleMarkAsRead(id: number) {
    await markNotificationAsRead(id);
    await notificationsQuery.refetch();
  }

  if (variant === "header") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label="Ouvrir les notifications"
          aria-expanded={expanded}
          className="relative grid h-10 w-10 place-items-center rounded-xl text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Bell className="h-5 w-5" />
          {nonLues.length > 0 && (
            <span className="absolute end-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {nonLues.length > 9 ? "9+" : nonLues.length}
            </span>
          )}
        </button>

        {expanded && (
          <div className="absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="font-serif text-lg">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {nonLues.length ? `${nonLues.length} non lue(s)` : "Tout est à jour"}
                </p>
              </div>
              <Bell className="h-4 w-4 text-accent-foreground" />
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted-foreground">Aucune notification.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto p-3">
                {notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`rounded-xl border p-3 ${
                      notification.lu
                        ? "border-border opacity-70"
                        : "border-accent/50 bg-accent/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{notification.titre}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {new Date(notification.creeLe).toLocaleString()}
                        </p>
                      </div>
                      {!notification.lu && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-input px-2 py-1 text-[11px] font-medium hover:bg-muted"
                        >
                          <Check className="h-3 w-3" />
                          Lu
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-5 text-start transition-colors hover:bg-muted/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-foreground">
          <Bell className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-xl">Notifications</span>
            {nonLues.length > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                {nonLues.length} nouvelle(s)
              </span>
            )}
          </span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {latestNotification?.titre ?? "Aucune notification."}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-xl border p-4 ${
                    notification.lu
                      ? "border-border opacity-70"
                      : "border-accent/50 bg-accent/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{notification.titre}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(notification.creeLe).toLocaleString()}
                      </p>
                    </div>

                    {!notification.lu && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Lu
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
