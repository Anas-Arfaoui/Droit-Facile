package com.droitfacile.notification;

import java.time.LocalDateTime;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record CreateRequest(
            Long destinataireId,
            String titre,
            String message
    ) {
    }

    public record Response(
            Long id,
            Long echeanceId,
            String type,
            String titre,
            String message,
            boolean lu,
            LocalDateTime creeLe
    ) {
        public static Response from(Notification notification) {
            return new Response(
                    notification.getId(),
                    notification.getEcheance() != null
                            ? notification.getEcheance().getId()
                            : null,
                    notification.getType().name(),
                    notification.getTitre(),
                    notification.getMessage(),
                    notification.isLu(),
                    notification.getCreeLe()
            );
        }
    }
}
