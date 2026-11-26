package com.droitfacile.notification;

import com.droitfacile.echeance.Echeance;
import com.droitfacile.echeance.EcheanceRepository;
import com.droitfacile.echeance.StatutEcheance;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EcheanceRepository echeanceRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            EcheanceRepository echeanceRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.echeanceRepository = echeanceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public int creerRappels() {
        LocalDate aujourdHui = LocalDate.now();

        List<Echeance> echeances = echeanceRepository.findByStatutIn(
                List.of(
                        StatutEcheance.A_VENIR,
                        StatutEcheance.EN_COURS
                )
        );

        int creees = 0;

        for (Echeance echeance : echeances) {
            LocalDate dateRappel = echeance.getDateEcheance()
                    .minusDays(echeance.getRappelJoursAvant());

            if (!aujourdHui.isBefore(dateRappel)) {
                String cle = "ECHEANCE-"
                        + echeance.getId()
                        + "-"
                        + echeance.getDateEcheance();

                if (notificationRepository.existsByCle(cle)) {
                    continue;
                }

                Notification notification = new Notification();
                notification.setDestinataire(echeance.getDossier().getAvocat());
                notification.setEcheance(echeance);
                notification.setType(TypeNotification.RAPPEL_ECHEANCE);
                notification.setTitre("Rappel d'échéance");
                notification.setMessage(
                        echeance.getTitre()
                                + " — dossier "
                                + echeance.getDossier().getTitre()
                );
                notification.setCle(cle);

                notificationRepository.save(notification);
                creees++;
            }
        }

        return creees;
    }

    @Transactional(readOnly = true)
    public List<NotificationDtos.Response> lister(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Utilisateur introuvable"
                ));

        return notificationRepository
                .findByDestinataireIdOrderByCreeLeDesc(user.getId())
                .stream()
                .map(NotificationDtos.Response::from)
                .toList();
    }

    @Transactional
    public NotificationDtos.Response marquerCommeLue(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Utilisateur introuvable"
                ));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification introuvable"
                ));

        if (!notification.getDestinataire().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Accès refusé à cette notification"
            );
        }

        notification.setLu(true);

        return NotificationDtos.Response.from(
                notificationRepository.save(notification)
        );
    }
}