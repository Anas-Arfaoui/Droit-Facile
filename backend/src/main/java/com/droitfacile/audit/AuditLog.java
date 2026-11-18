package com.droitfacile.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String utilisateur;   // email

    @Column(nullable = false)
    private String action;

    private String entite;
    private Long entiteId;
    private LocalDateTime dateAction = LocalDateTime.now();
}
