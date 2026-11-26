package com.droitfacile.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDtos.Response> list(Authentication auth) {
        return notificationService.lister(auth.getName());
    }

    @PatchMapping("/{id}/lu")
    public NotificationDtos.Response markAsRead(
            @PathVariable Long id,
            Authentication auth
    ) {
        return notificationService.marquerCommeLue(id, auth.getName());
    }

    @PostMapping("/test-rappels")
    @PreAuthorize("hasAnyRole('AVOCAT', 'ADMIN')")
    public ResponseEntity<Map<String, Integer>> testReminders() {
        int count = notificationService.creerRappels();

        return ResponseEntity.ok(
                Map.of("notificationsCreees", count)
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationDtos.Response create(
            @RequestBody NotificationDtos.CreateRequest request
    ) {
        return notificationService.creerMessageAdmin(request);
    }
}
