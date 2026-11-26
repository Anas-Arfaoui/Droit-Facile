import { useQuery } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";

import {
  listNotifications,
  markNotificationAsRead,
} from "@/api/notifications";

export function NotificationPanel({ enabled = true }: { enabled?: boolean }) {
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled,
  });

  if (!enabled) return null;

  if (notificationsQuery.isLoading) {
    return (
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Chargement des notifications...
        </p>
      </section>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-destructive">
          Impossible de charger les notifications.
        </p>
      </section>
    );
  }

  const notifications = notificationsQuery.data ?? [];
  const nonLues = notifications.filter((notification) => !notification.lu);

  async function handleMarkAsRead(id: number) {
    await markNotificationAsRead(id);
    await notificationsQuery.refetch();
  }

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-accent" />
        <h2 className="text-xl">Notifications</h2>

        {nonLues.length > 0 && (
          <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
            {nonLues.length} nouvelle(s)
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aucune notification.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-md border p-4 ${
                notification.lu
                  ? "border-border opacity-70"
                  : "border-accent/50 bg-accent/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
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
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-muted"
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
    </section>
  );
}