package com.droitfacile.seance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeanceRepository extends JpaRepository<Seance, Long> {
    List<Seance> findByDossierIdOrderByDateSeanceDesc(Long dossierId);
}
