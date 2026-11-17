package com.droitfacile.auth;

import com.droitfacile.audit.AuditService;
import com.droitfacile.auth.AuthDtos.AuthResponse;
import com.droitfacile.auth.AuthDtos.LoginRequest;
import com.droitfacile.auth.AuthDtos.RegisterRequest;
import org.springframework.web.server.ResponseStatusException;
import com.droitfacile.security.JwtService;
import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserController.UserResponse;
import com.droitfacile.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    /** Story : Inscription */
    public UserResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le role ADMIN n'est pas autorise a l'inscription");
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est deja utilise");
        }

        User user = new User();
        user.setNom(req.nom().trim());
        user.setEmail(email);
        user.setMotDePasse(passwordEncoder.encode(req.motDePasse()));
        user.setRole(req.role());
        user = userRepository.save(user);

        auditService.log(email, "INSCRIPTION", "User", user.getId());
        return UserResponse.from(user);
    }

    /** Story : Authentification (renvoie un JWT) */
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.motDePasse(), u.getMotDePasse()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));

        auditService.log(email, "CONNEXION", "User", user.getId());
        return new AuthResponse(jwtService.generateToken(email), user.getId(), user.getNom(), email, user.getRole());
    }
}
