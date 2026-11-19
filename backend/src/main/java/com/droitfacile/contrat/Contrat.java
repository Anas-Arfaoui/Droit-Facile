package com.droitfacile.contrat;

import com.droitfacile.dossier.Dossier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "contrat")
@Getter
@Setter
@NoArgsConstructor
public class Contrat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    /** Nom d'origine du fichier (affichage). */
    @Column(nullable = false)
    private String nomFichier;

    /** Nom du fichier sur le disque (UUID), jamais fourni par l'utilisateur. */
    @Column(nullable = false)
    private String nomStocke;

    /** "pdf" ou "docx". */
    @Column(nullable = false)
    private String typeFichier;

    @Column(nullable = false)
    private long tailleOctets;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LangueContrat langue;

    /** Vrai si aucun texte n'a pu etre extrait (document scanne) : un OCR sera necessaire. */
    @Column(nullable = false)
    private boolean ocrNecessaire;

    @Column(columnDefinition = "TEXT")
    private String texte;

    /** Email de l'avocat qui a importe le contrat. */
    @Column(nullable = false)
    private String importePar;

    private LocalDateTime importeLe = LocalDateTime.now();
}
