package com.droitfacile.clause;

import com.droitfacile.contrat.Contrat;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "clause")
@Getter
@Setter
@NoArgsConstructor
public class Clause {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "contrat_id")
    private Contrat contrat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeClause type;

    @Column(nullable = false)
    private String titre;

    /** Passage recopie du contrat (la source de la clause). */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String extrait;

    /** Faux si l'extrait donne par l'IA n'a pas ete retrouve dans le texte du contrat. */
    @Column(nullable = false)
    private boolean extraitVerifie;

    @Column(columnDefinition = "TEXT")
    private String explication;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NiveauRisque niveauRisque;

    @Column(columnDefinition = "TEXT")
    private String motifRisque;

    private LocalDateTime creeLe = LocalDateTime.now();
}
