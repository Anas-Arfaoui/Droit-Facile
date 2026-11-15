package com.droitfacile.config;

import com.droitfacile.user.Role;
import com.droitfacile.user.User;
import com.droitfacile.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Cree un compte ADMIN au demarrage (l'inscription n'autorise pas ADMIN). */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           @Value("${app.admin.email}") String adminEmail,
                           @Value("${app.admin.password}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setNom("Administrateur");
            admin.setEmail(adminEmail);
            admin.setMotDePasse(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }
    }
}
