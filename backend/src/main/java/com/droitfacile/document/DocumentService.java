
package com.droitfacile.document;

import com.droitfacile.dossier.Dossier;
import com.droitfacile.dossier.DossierRepository;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import com.droitfacile.document.DocumentDtos.Response;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DossierRepository dossierRepository;
    private final UserRepository userRepository;

    @Value("${app.storage.dir:./uploads}")
    private String storageDir;

    public DocumentService(
            DocumentRepository documentRepository,
            DossierRepository dossierRepository,
            UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.dossierRepository = dossierRepository;
        this.userRepository = userRepository;
    }

    public Document upload(Long dossierId, MultipartFile file, String email) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide");
        }

        if (file.getSize() > 20 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier trop volumineux");
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        verifierAcces(dossier, user);

        String nomOriginal = file.getOriginalFilename();
        String nomStocke = UUID.randomUUID() + "_" + (nomOriginal == null ? "document" : nomOriginal);

        try {
            Path dossierStockage = Paths.get(storageDir).toAbsolutePath().normalize();
            Files.createDirectories(dossierStockage);

            Path cheminFichier = dossierStockage.resolve(nomStocke).normalize();

            if (!cheminFichier.startsWith(dossierStockage)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom de fichier invalide");
            }

            Files.copy(file.getInputStream(), cheminFichier);

            Document document = new Document();
            document.setDossier(dossier);
            document.setEnvoyeur(user);
            document.setNomFichier(nomOriginal == null ? "document" : nomOriginal);
            document.setNomStocke(nomStocke);
            document.setTypeFichier(file.getContentType());
            document.setTailleOctets(file.getSize());

            return documentRepository.save(document);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors du stockage du fichier");
        }
    }

    public List<Response> getDocuments(Long dossierId, String email) {

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        verifierAcces(dossier, user);

        return documentRepository.findByDossierIdOrderByEnvoyeLeDesc(dossierId)
                .stream()
                .map(Response::from)
                .toList();
    }

    public Document getDocument(Long id, String email) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document introuvable"));

        verifierAcces(document.getDossier(), getUser(email));

        return document;
    }

    public void delete(Long id, String email) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document introuvable"));

        User user = getUser(email);

        if (!document.getDossier().getAvocat().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'avocat propriétaire peut supprimer ce document");
        }

        try {
            Path chemin = Paths.get(storageDir).toAbsolutePath().normalize()
                    .resolve(document.getNomStocke()).normalize();

            if (chemin.startsWith(Paths.get(storageDir).toAbsolutePath().normalize())) {
                Files.deleteIfExists(chemin);
            }

            documentRepository.delete(document);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de la suppression du fichier");
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private void verifierAcces(Dossier dossier, User user) {
        boolean avocat = dossier.getAvocat().getId().equals(user.getId());
        boolean client = dossier.getClient().getId().equals(user.getId());

        if (!avocat && !client) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à ce dossier");
        }
    }
}
