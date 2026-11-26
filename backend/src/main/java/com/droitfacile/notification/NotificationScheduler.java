package com.droitfacile.notification;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    private final NotificationService notificationService;

    public NotificationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Scheduled(
            cron = "${app.notifications.cron:0 0 8 * * *}",
            zone = "Africa/Lagos"
    )
    public void traiterRappels() {
        notificationService.creerRappels();
    }
}