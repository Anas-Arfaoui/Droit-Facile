package com.droitfacile.user;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    public record UserResponse(Long id, String nom, String email, Role role, boolean actif) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getNom(), u.getEmail(), u.getRole(), u.isActif());
        }
    }

    public record AccountStatusRequest(boolean actif) {}

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication auth) {
        return UserResponse.from(userRepository.findByEmail(auth.getName()).orElseThrow());
    }

    /** L'avocat s'en sert pour choisir le client d'un dossier. */
    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('AVOCAT','ADMIN')")
    public List<UserResponse> clients() {
        return userRepository.findByRole(Role.CLIENT).stream().map(UserResponse::from).toList();
    }
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> all() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStatus(@PathVariable Long id, @RequestBody AccountStatusRequest request) {
        User user = userRepository.findById(id).orElseThrow();
        if (user.getRole() == Role.ADMIN && !request.actif()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Un compte administrateur ne peut pas être désactivé ici");
        }
        user.setActif(request.actif());
        return UserResponse.from(userRepository.save(user));
    }
}
