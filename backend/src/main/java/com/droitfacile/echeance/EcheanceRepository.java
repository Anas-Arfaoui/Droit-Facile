package com.droitfacile.echeance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    List<Echeance> findByDossierIdOrderByDateEcheanceAsc(Long dossierId);

    List<Echeance>
    findByDossierAvocatIdAndStatutInAndDateEcheanceLessThanEqualOrderByDateEcheanceAsc(
            Long avocatId,
            Collection<StatutEcheance> statuts,
            LocalDate date
    );

    List<Echeance>
    findByStatutInAndDateEcheanceLessThanEqualOrderByDateEcheanceAsc(
            Collection<StatutEcheance> statuts,
            LocalDate date
    );
    List<Echeance> findByStatutIn(Collection<StatutEcheance> statuts);
}