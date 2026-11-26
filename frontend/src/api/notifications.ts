import { apiRequest } from "./client";

export type Notification = {
  id: number;
  echeanceId: number | null;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  creeLe: string;
};

export function listNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications");
}

export function markNotificationAsRead(id: number): Promise<Notification> {
  return apiRequest<Notification>(`/notifications/${id}/lu`, {
    method: "PATCH",
  });
}