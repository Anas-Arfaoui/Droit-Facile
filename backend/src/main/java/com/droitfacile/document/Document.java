
package com.droitfacile.document;

import com.droitfacile.dossier.Dossier;
import com.droitfacile.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    @ManyToOne(optional = false)
    @JoinColumn(name = "envoyeur_id", nullable = false)
    private User envoyeur;

    @Column(nullable = false)
    private String nomFichier;

    @Column(nullable = false)
    private String nomStocke;

    @Column(nullable = false)
    private String typeFichier;

    @Column(nullable = false)
    private long tailleOctets;

    @Column(nullable = false)
    private LocalDateTime envoyeLe = LocalDateTime.now();
}
