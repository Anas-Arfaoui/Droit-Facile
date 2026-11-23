package com.droitfacile.echeance;

import com.droitfacile.dossier.Dossier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "echeance")
@Getter
@Setter
@NoArgsConstructor
public class Echeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @ManyToOne(optional = false)
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @Column(nullable = false)
    private String titre;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate dateEcheance;

    @Column(nullable = false)
    private Integer rappelJoursAvant = 7;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutEcheance statut = StatutEcheance.A_VENIR;

    @Column(nullable = false)
    private LocalDateTime creeLe = LocalDateTime.now();

    private LocalDateTime modifieLe = LocalDateTime.now();

    @PreUpdate
    public void avantModification() {
        modifieLe = LocalDateTime.now();
    }
}