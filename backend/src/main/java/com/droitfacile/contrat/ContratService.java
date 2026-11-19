package com.droitfacile.contrat;

import com.droitfacile.audit.AuditService;
import com.droitfacile.contrat.ContratDtos.Detail;
import com.droitfacile.contrat.ContratDtos.Response;
import com.droitfacile.dossier.Dossier;
import com.droitfacile.dossier.DossierService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

/** Story : Importer un contrat FR/AR dans un dossier. */
@Service
public class ContratService {

    private static final long TAILLE_MAX = 20L * 1024 * 1024;

    private final ContratRepository contratRepository;
    private final DossierService dossierService;
    private final TexteExtracteur extracteur;
    private final AuditService auditService;
    private final Path stockage;

    public ContratService(ContratRepository contratRepository, DossierService dossierService,
                          TexteExtracteur extracteur, AuditService auditService,
                          @Value("${app.storage.dir:./uploads}") String dossierStockage) {
        this.contratRepository = contratRepository;
        this.dossierService = dossierService;
        this.extracteur = extracteur;
        this.auditService = auditService;
        this.stockage = Paths.get(dossierStockage).toAbsolutePath().normalize();
    }

    public Response importer(Long dossierId, MultipartFile fichier, String email) {
        Dossier dossier = dossierService.getOwned(dossierId, email);

        if (fichier == null || fichier.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier manquant ou vide");
        }
        if (fichier.getSize() > TAILLE_MAX) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Fichier trop volumineux (20 Mo maximum)");
        }

        String nomOriginal = nomAffichable(fichier.getOriginalFilename());
        String extension = extension(nomOriginal);
        if (!extension.equals("pdf") && !extension.equals("docx")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format non supporte : PDF ou DOCX uniquement");
        }

        byte[] octets;
        String texte;
        try {
            octets = fichier.getBytes();
            texte = extracteur.extraire(octets, extension);
        } catch (IOException | RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Impossible de lire ce fichier (corrompu ou protege par mot de passe)");
        }

        String nomStocke = UUID.randomUUID() + "." + extension;
        try {
            Files.createDirectories(stockage);
            Files.write(stockage.resolve(nomStocke), octets);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec de l'enregistrement du fichier");
        }

        Contrat c = new Contrat();
        c.setDossier(dossier);
        c.setNomFichier(nomOriginal);
        c.setNomStocke(nomStocke);
        c.setTypeFichier(extension);
        c.setTailleOctets(fichier.getSize());
        c.setTexte(texte);
        c.setOcrNecessaire(texte.isBlank());
        c.setLangue(extracteur.detecterLangue(texte));
        c.setImportePar(email);
        c = contratRepository.save(c);

        auditService.log(email, "CONTRAT_IMPORTE", "Contrat", c.getId());
        return Response.from(c);
    }

    public List<Response> lister(Long dossierId, String email) {
        dossierService.getOwned(dossierId, email);
        return contratRepository.findByDossierIdOrderByImporteLeDesc(dossierId)
                .stream().map(Response::from).toList();
    }

    public Detail detail(Long id, String email) {
        Contrat c = getOwned(id, email);
        return new Detail(Response.from(c), c.getTexte());
    }

    /** Contrat accessible uniquement a l'avocat responsable du dossier. */
    public Contrat getOwned(Long id, String email) {
        Contrat c = contratRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrat introuvable"));
        dossierService.getOwned(c.getDossier().getId(), email);
        return c;
    }

    public Resource fichier(Contrat c) {
        Path chemin = stockage.resolve(c.getNomStocke()).normalize();
        if (!Files.isRegularFile(chemin)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable sur le serveur");
        }
        return new FileSystemResource(chemin);
    }

    private String nomAffichable(String original) {
        String nom = StringUtils.cleanPath(original == null ? "contrat" : original);
        int separateur = nom.lastIndexOf('/');
        if (separateur >= 0) {
            nom = nom.substring(separateur + 1);
        }
        return nom.isBlank() ? "contrat" : nom;
    }

    private String extension(String nom) {
        int point = nom.lastIndexOf('.');
        return point < 0 ? "" : nom.substring(point + 1).toLowerCase();
    }
}
