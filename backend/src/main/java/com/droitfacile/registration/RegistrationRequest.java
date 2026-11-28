package com.droitfacile.registration;

import com.droitfacile.user.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "registration_requests")
@Getter
@Setter
@NoArgsConstructor
public class RegistrationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String avocatNom;
    private Long avocatId;
    private String officialRecords;
    private String correspondenceRecords;
    private String contractFileName;
    private String contractFileType;

    @Lob
    private byte[] contractFile;

    private String numeroAffaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.EN_ATTENTE;

    @Column(nullable = false)
    private LocalDateTime creeLe = LocalDateTime.now();

    private LocalDateTime traiteLe;
    private String motifRefus;
}
