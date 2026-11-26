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

export type CreateNotificationRequest = {
  destinataireId: number;
  titre: string;
  message: string;
};

export function listNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications");
}

export function markNotificationAsRead(id: number): Promise<Notification> {
  return apiRequest<Notification>(`/notifications/${id}/lu`, {
    method: "PATCH",
  });
}

export function createNotification(
  data: CreateNotificationRequest,
): Promise<Notification> {
  return apiRequest<Notification>("/notifications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
