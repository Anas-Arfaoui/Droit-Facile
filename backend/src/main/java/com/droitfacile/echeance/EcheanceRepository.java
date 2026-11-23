package com.droitfacile.echeance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    List<Echeance> findByDossierIdOrderByDateEcheanceAsc(Long dossierId);
}