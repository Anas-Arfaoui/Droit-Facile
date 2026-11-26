package com.droitfacile.dossier;

import com.droitfacile.audit.AuditService;
import org.springframework.web.server.ResponseStatusException;
import com.droitfacile.dossier.DossierDtos.CreateRequest;
import com.droitfacile.dossier.DossierDtos.Response;
import com.droitfacile.dossier.DossierDtos.UpdateRequest;
import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Story : Gerer dossier client (ouvrir, modifier, changer le statut). */
@Service
public class DossierService {

    private final DossierRepository dossierRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public DossierService(DossierRepository dossierRepository, UserRepository userRepository,
                          AuditService auditService) {
        this.dossierRepository = dossierRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public Response create(CreateRequest req, String email) {
        User avocat = findUser(email);

        User client = userRepository.findById(req.clientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client introuvable"));
        if (client.getRole() != Role.CLIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utilisateur choisi n'est pas un client");
        }

        Dossier d = new Dossier();
        d.setTitre(req.titre().trim());
        d.setDescription(req.description());
        d.setAvocat(avocat);
        d.setClient(client);
        d = dossierRepository.save(d);

        auditService.log(email, "DOSSIER_CREE", "Dossier", d.getId());
        return Response.from(d);
    }

    /** Avocat : ses dossiers. Client : ses dossiers. Admin : tous. */
    public List<Response> list(String email) {
        User u = findUser(email);
        List<Dossier> dossiers;
        if (u.getRole() == Role.ADMIN) {
            dossiers = dossierRepository.findAllByOrderByCreeLeDesc();
        } else if (u.getRole() == Role.AVOCAT) {
            dossiers = dossierRepository.findByAvocatIdOrderByCreeLeDesc(u.getId());
        } else {
            dossiers = dossierRepository.findByClientIdOrderByCreeLeDesc(u.getId());
        }
        return dossiers.stream().map(Response::from).toList();
    }

    public Response get(Long id, String email) {
        return Response.from(getReadable(id, email));
    }

    public Response update(Long id, UpdateRequest req, String email) {
        Dossier d = getOwned(id, email);
        d.setTitre(req.titre().trim());
        d.setDescription(req.description());
        d = dossierRepository.save(d);
        auditService.log(email, "DOSSIER_MODIFIE", "Dossier", id);
        return Response.from(d);
    }

    public Response changeStatut(Long id, StatutDossier statut, String email) {
        Dossier d = getOwned(id, email);
        d.setStatut(statut);
        d = dossierRepository.save(d);
        auditService.log(email, "DOSSIER_STATUT_" + statut, "Dossier", id);
        return Response.from(d);
    }

    public Response activateSharing(Long id, String email) {
        Dossier d = getOwned(id, email);

        d.activerPartage();
        d = dossierRepository.save(d);

        auditService.log(email, "DOSSIER_PARTAGE", "Dossier", id);

        return Response.from(d);
    }

    public Response getShared(String token) {
        Dossier d = dossierRepository
                .findByPartageTokenAndPartageActifTrue(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lien de partage invalide"
                ));

        return Response.from(d);
    }

    /** Lisible par : son avocat, son client, ou un admin. */
    public Dossier getReadable(Long id, String email) {
        User u = findUser(email);
        Dossier d = find(id);
        boolean ok = u.getRole() == Role.ADMIN
                || d.getAvocat().getId().equals(u.getId())
                || d.getClient().getId().equals(u.getId());
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse a ce dossier");
        }
        return d;
    }

    /** Modifiable uniquement par l'avocat responsable. */
    public Dossier getOwned(Long id, String email) {
        User u = findUser(email);
        Dossier d = find(id);
        if (!d.getAvocat().getId().equals(u.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'avocat responsable peut modifier ce dossier");
        }
        return d;
    }

    private Dossier find(Long id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
    }
}
