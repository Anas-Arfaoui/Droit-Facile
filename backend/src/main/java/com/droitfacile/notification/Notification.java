package com.droitfacile.notification;

import com.droitfacile.echeance.Echeance;
import com.droitfacile.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destinataire_id")
    private User destinataire;

    @ManyToOne
    @JoinColumn(name = "echeance_id")
    private Echeance echeance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotification type;

    @Column(nullable = false)
    private String titre;

    @Column(length = 2000, nullable = false)
    private String message;

    @Column(nullable = false, unique = true)
    private String cle;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime creeLe = LocalDateTime.now();
}