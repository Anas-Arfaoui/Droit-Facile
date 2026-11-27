package com.droitfacile.auth;

import com.droitfacile.audit.AuditService;
import com.droitfacile.auth.AuthDtos.AuthResponse;
import com.droitfacile.auth.AuthDtos.LoginRequest;
import com.droitfacile.auth.AuthDtos.RegisterRequest;
import com.droitfacile.auth.AuthDtos.RegistrationResponse;
import org.springframework.web.server.ResponseStatusException;
import com.droitfacile.security.JwtService;
import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserController.UserResponse;
import com.droitfacile.user.UserRepository;
import com.droitfacile.notification.NotificationService;
import com.droitfacile.registration.RegistrationRequest;
import com.droitfacile.registration.RegistrationRepository;
import com.droitfacile.registration.RegistrationStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuditService auditService,
                       RegistrationRepository registrationRepository,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.registrationRepository = registrationRepository;
        this.notificationService = notificationService;
    }

    /** Story : Inscription */
    public RegistrationResponse register(RegisterRequest req, MultipartFile contractFile) {
        if (req.role() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le role ADMIN n'est pas autorise a l'inscription");
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est deja utilise");
        }
        if (registrationRepository.existsByEmailAndStatus(email, RegistrationStatus.EN_ATTENTE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une demande est deja en attente pour cet email");
        }
        if (req.role() == Role.AVOCAT && (isBlank(req.officialRecords()) || isBlank(req.correspondenceRecords()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les justificatifs officiels et de correspondance sont obligatoires pour un avocat");
        }
        if (req.role() == Role.CLIENT && (req.avocatId() == null || isBlank(req.avocatNom()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le client doit renseigner son avocat et le numero d'affaire");
        }
        if (req.role() == Role.CLIENT) {
            User avocat = userRepository.findById(req.avocatId()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'avocat indique est introuvable"));
            if (avocat.getRole() != Role.AVOCAT) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'utilisateur indique n'est pas un avocat");
            }
        }
        if (req.role() == Role.CLIENT && isBlank(req.numeroAffaire()) && (contractFile == null || contractFile.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le client doit fournir un numero d'affaire ou un contrat");
        }

        RegistrationRequest request = new RegistrationRequest();
        request.setNom(req.nom().trim());
        request.setEmail(email);
        request.setMotDePasse(passwordEncoder.encode(req.motDePasse()));
        request.setRole(req.role());
        request.setAvocatNom(req.avocatNom());
        request.setAvocatId(req.avocatId());
        request.setOfficialRecords(req.officialRecords());
        request.setCorrespondenceRecords(req.correspondenceRecords());
        request.setNumeroAffaire(req.numeroAffaire());
        if (contractFile != null && !contractFile.isEmpty()) {
            try {
                request.setContractFile(contractFile.getBytes());
                request.setContractFileName(contractFile.getOriginalFilename());
                request.setContractFileType(contractFile.getContentType());
            } catch (java.io.IOException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de lire le contrat fourni");
            }
        }
        request = registrationRepository.save(request);

        auditService.log(email, "DEMANDE_INSCRIPTION", "RegistrationRequest", request.getId());
        notificationService.notifierAdminsNouvelleDemande(request.getId(), request.getNom(), request.getEmail(), request.getRole().name());
        return new RegistrationResponse(request.getId(), request.getNom(), request.getEmail(), request.getRole(), request.getStatus().name());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** Story : Authentification (renvoie un JWT) */
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.motDePasse(), u.getMotDePasse()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));
        if (!user.isActif()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce compte est désactivé");
        }

        auditService.log(email, "CONNEXION", "User", user.getId());
        return new AuthResponse(jwtService.generateToken(email), user.getId(), user.getNom(), email, user.getRole());
    }
}
