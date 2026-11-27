package com.droitfacile.registration;

import com.droitfacile.audit.AuditService;
import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserController.UserResponse;
import com.droitfacile.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/registration-requests")
@PreAuthorize("hasRole('ADMIN')")
public class RegistrationController {
    public record RegistrationResponse(Long id, String nom, String email, Role role, String status,
                                       String avocatNom, Long avocatId, String officialRecords,
                                       String correspondenceRecords, String contractFileName,
                                       String numeroAffaire, boolean hasContractFile,
                                       LocalDateTime creeLe, String motifRefus) {
        static RegistrationResponse from(RegistrationRequest request) {
            return new RegistrationResponse(request.getId(), request.getNom(), request.getEmail(), request.getRole(),
                    request.getStatus().name(), request.getAvocatNom(), request.getAvocatId(), request.getOfficialRecords(),
                    request.getCorrespondenceRecords(), request.getContractFileName(), request.getNumeroAffaire(),
                    request.getContractFile() != null && request.getContractFile().length > 0,
                    request.getCreeLe(), request.getMotifRefus());
        }
    }

    public record RefusalRequest(String motif) {}

    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RegistrationController(RegistrationRepository registrationRepository, UserRepository userRepository, AuditService auditService) {
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public List<RegistrationResponse> all() {
        return registrationRepository.findAllByOrderByCreeLeDesc().stream().map(RegistrationResponse::from).toList();
    }

    @GetMapping("/{id}/contract")
    public ResponseEntity<ByteArrayResource> contract(@PathVariable Long id) {
        RegistrationRequest request = get(id);
        if (request.getContractFile() == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrat absent");
        MediaType type = MediaType.APPLICATION_OCTET_STREAM;
        try { if (request.getContractFileType() != null) type = MediaType.parseMediaType(request.getContractFileType()); } catch (Exception ignored) {}
        return ResponseEntity.ok().contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + request.getContractFileName() + "\"")
                .body(new ByteArrayResource(request.getContractFile()));
    }

    @PostMapping("/{id}/approve")
    public UserResponse approve(@PathVariable Long id) {
        RegistrationRequest request = get(id);
        if (request.getStatus() != RegistrationStatus.EN_ATTENTE) throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette demande est deja traitee");
        if (userRepository.existsByEmail(request.getEmail())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est deja utilise");
        User user = new User();
        user.setNom(request.getNom()); user.setEmail(request.getEmail()); user.setMotDePasse(request.getMotDePasse()); user.setRole(request.getRole());
        user = userRepository.save(user);
        request.setStatus(RegistrationStatus.APPROUVEE); request.setTraiteLe(LocalDateTime.now()); registrationRepository.save(request);
        auditService.log("admin", "APPROBATION_INSCRIPTION", "User", user.getId());
        return UserResponse.from(user);
    }

    @PostMapping("/{id}/reject")
    public RegistrationResponse reject(@PathVariable Long id, @RequestBody(required = false) RefusalRequest body) {
        RegistrationRequest request = get(id);
        if (request.getStatus() != RegistrationStatus.EN_ATTENTE) throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette demande est deja traitee");
        request.setStatus(RegistrationStatus.REFUSEE); request.setTraiteLe(LocalDateTime.now()); request.setMotifRefus(body == null ? null : body.motif());
        request = registrationRepository.save(request);
        auditService.log("admin", "REFUS_INSCRIPTION", "RegistrationRequest", request.getId());
        return RegistrationResponse.from(request);
    }

    private RegistrationRequest get(Long id) { return registrationRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable")); }
}
