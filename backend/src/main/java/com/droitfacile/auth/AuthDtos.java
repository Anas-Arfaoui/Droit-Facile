package com.droitfacile.auth;

import com.droitfacile.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String nom,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "8 caracteres minimum") String motDePasse,
            @NotNull Role role,
            String avocatNom,
            Long avocatId,
            String officialRecords,
            String correspondenceRecords,
            String numeroAffaire) {
    }

    public record RegistrationResponse(Long id, String nom, String email, Role role, String status) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String motDePasse) {
    }

    public record AuthResponse(String token, Long id, String nom, String email, Role role) {
    }
}
