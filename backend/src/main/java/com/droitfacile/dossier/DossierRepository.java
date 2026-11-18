package com.droitfacile.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DossierRepository extends JpaRepository<Dossier, Long> {
    List<Dossier> findByAvocatIdOrderByCreeLeDesc(Long avocatId);

    List<Dossier> findByClientIdOrderByCreeLeDesc(Long clientId);

    List<Dossier> findAllByOrderByCreeLeDesc();

    Optional<Dossier> findByPartageTokenAndPartageActifTrue(String partageToken);
}
