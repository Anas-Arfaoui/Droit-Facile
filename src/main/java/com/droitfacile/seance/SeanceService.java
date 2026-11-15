package com.droitfacile.seance;

import com.droitfacile.audit.AuditService;
import com.droitfacile.dossier.Dossier;
import com.droitfacile.dossier.DossierService;
import com.droitfacile.seance.SeanceDtos.CreateRequest;
import com.droitfacile.seance.SeanceDtos.Response;
import org.springframework.stereotype.Service;

import java.util.List;

/** Story : Creer une seance. */
@Service
public class SeanceService {

    private final SeanceRepository seanceRepository;
    private final DossierService dossierService;
    private final AuditService auditService;

    public SeanceService(SeanceRepository seanceRepository, DossierService dossierService,
                         AuditService auditService) {
        this.seanceRepository = seanceRepository;
        this.dossierService = dossierService;
        this.auditService = auditService;
    }

    public Response create(Long dossierId, CreateRequest req, String email) {
        Dossier dossier = dossierService.getOwned(dossierId, email);

        Seance s = new Seance();
        s.setDossier(dossier);
        s.setDateSeance(req.dateSeance());
        s.setNotes(req.notes());
        s = seanceRepository.save(s);

        auditService.log(email, "SEANCE_CREEE", "Seance", s.getId());
        return Response.from(s);
    }

    public List<Response> list(Long dossierId, String email) {
        Dossier dossier = dossierService.getReadable(dossierId, email);
        return seanceRepository.findByDossierIdOrderByDateSeanceDesc(dossier.getId())
                .stream().map(Response::from).toList();
    }
}
