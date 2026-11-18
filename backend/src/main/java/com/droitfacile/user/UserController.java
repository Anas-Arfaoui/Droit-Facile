package com.droitfacile.user;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    public record UserResponse(Long id, String nom, String email, Role role) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getNom(), u.getEmail(), u.getRole());
        }
    }

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
}
