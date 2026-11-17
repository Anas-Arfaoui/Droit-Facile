package com.droitfacile.seance;

import com.droitfacile.dossier.Dossier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "seance")
@Getter
@Setter
@NoArgsConstructor
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @Column(nullable = false)
    private LocalDateTime dateSeance;

    @Column(length = 4000)
    private String notes;
}
