package com.droitfacile.echeance;

import com.droitfacile.audit.AuditService;
import com.droitfacile.dossier.Dossier;
import com.droitfacile.dossier.DossierService;
import com.droitfacile.echeance.EcheanceDtos.CreateRequest;
import com.droitfacile.echeance.EcheanceDtos.Response;
import com.droitfacile.echeance.EcheanceDtos.UpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import java.time.LocalDate;
import java.util.List;

@Service
public class EcheanceService {

    private final EcheanceRepository echeanceRepository;
    private final DossierService dossierService;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public EcheanceService(
            EcheanceRepository echeanceRepository,
            DossierService dossierService,
            AuditService auditService,
            UserRepository userRepository
    ) {
        this.echeanceRepository = echeanceRepository;
        this.dossierService = dossierService;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    public Response create(Long dossierId, CreateRequest request, String email) {
        Dossier dossier = dossierService.getOwned(dossierId, email);

        Echeance echeance = new Echeance();
        echeance.setDossier(dossier);
        echeance.setTitre(request.titre().trim());
        echeance.setDescription(request.description());
        echeance.setDateEcheance(request.dateEcheance());
        echeance.setRappelJoursAvant(request.rappelJoursAvant());
        echeance.setStatut(StatutEcheance.A_VENIR);

        echeance = echeanceRepository.save(echeance);

        auditService.log(email, "ECHEANCE_CREEE", "Echeance", echeance.getId());

        return Response.from(echeance);
    }

    public List<Response> list(Long dossierId, String email) {
        dossierService.getReadable(dossierId, email);

        return echeanceRepository
                .findByDossierIdOrderByDateEcheanceAsc(dossierId)
                .stream()
                .map(Response::from)
                .toList();
    }

    public Response get(Long id, String email) {
        Echeance echeance = find(id);
        dossierService.getReadable(echeance.getDossier().getId(), email);
        return Response.from(echeance);
    }

    public Response update(Long id, UpdateRequest request, String email) {
        Echeance echeance = findOwned(id, email);

        echeance.setTitre(request.titre().trim());
        echeance.setDescription(request.description());
        echeance.setDateEcheance(request.dateEcheance());
        echeance.setRappelJoursAvant(request.rappelJoursAvant());
        echeance.setStatut(request.statut());

        echeance = echeanceRepository.save(echeance);

        auditService.log(email, "ECHEANCE_MODIFIEE", "Echeance", id);

        return Response.from(echeance);
    }

    public Response changeStatus(
            Long id,
            StatutEcheance statut,
            String email
    ) {
        Echeance echeance = findOwned(id, email);
        echeance.setStatut(statut);
        echeance = echeanceRepository.save(echeance);

        auditService.log(email, "ECHEANCE_STATUT_" + statut, "Echeance", id);

        return Response.from(echeance);
    }

    public void delete(Long id, String email) {
        Echeance echeance = findOwned(id, email);
        echeanceRepository.delete(echeance);

        auditService.log(email, "ECHEANCE_SUPPRIMEE", "Echeance", id);
    }
    public List<EcheanceDtos.RappelResponse> rappels(
        int jours,
        String email
    ) {
        if (jours < 0 || jours > 365) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Le nombre de jours doit être compris entre 0 et 365"
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Utilisateur introuvable"
                ));

        List<StatutEcheance> statuts = List.of(
                StatutEcheance.A_VENIR,
                StatutEcheance.EN_COURS
        );

        LocalDate limite = LocalDate.now().plusDays(jours);

        List<Echeance> echeances;

        if (user.getRole() == com.droitfacile.user.Role.ADMIN) {
            echeances = echeanceRepository
                    .findByStatutInAndDateEcheanceLessThanEqualOrderByDateEcheanceAsc(
                            statuts,
                            limite
                    );
        } else {
            echeances = echeanceRepository
                    .findByDossierAvocatIdAndStatutInAndDateEcheanceLessThanEqualOrderByDateEcheanceAsc(
                            user.getId(),
                            statuts,
                            limite
                    );
        }

        LocalDate aujourdHui = LocalDate.now();

        return echeances.stream()
                .map(echeance -> EcheanceDtos.RappelResponse.from(echeance, aujourdHui))
                .toList();
    }

    private Echeance findOwned(Long id, String email) {
        Echeance echeance = find(id);
        dossierService.getOwned(echeance.getDossier().getId(), email);
        return echeance;
    }

    private Echeance find(Long id) {
        return echeanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Echeance introuvable"
                ));
    }
}