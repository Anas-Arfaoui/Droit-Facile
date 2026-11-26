package com.droitfacile.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    boolean existsByCle(String cle);

    List<Notification> findByDestinataireIdOrderByCreeLeDesc(Long destinataireId);
}