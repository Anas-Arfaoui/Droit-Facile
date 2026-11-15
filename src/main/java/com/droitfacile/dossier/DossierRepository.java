package com.droitfacile.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DossierRepository extends JpaRepository<Dossier, Long> {
    List<Dossier> findByAvocatIdOrderByCreeLeDesc(Long avocatId);

    List<Dossier> findByClientIdOrderByCreeLeDesc(Long clientId);

    List<Dossier> findAllByOrderByCreeLeDesc();
}
