package com.droitfacile.dossier;

import com.droitfacile.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dossier")
@Getter
@Setter
@NoArgsConstructor
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDossier statut = StatutDossier.OUVERT;

    @ManyToOne(optional = false)
    @JoinColumn(name = "avocat_id")
    private User avocat;

    @ManyToOne(optional = false)
    @JoinColumn(name = "client_id")
    private User client;

    private LocalDateTime creeLe = LocalDateTime.now();
    @Column(unique = true)
    private String partageToken;

    @Column(nullable = false)
    private boolean partageActif = false;

    public void activerPartage() {
        if (partageToken == null) {
            partageToken = UUID.randomUUID().toString();
        }

        partageActif = true;
    }
}
