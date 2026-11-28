package com.droitfacile.auth;

import com.droitfacile.auth.AuthDtos.AuthResponse;
import com.droitfacile.auth.AuthDtos.LoginRequest;
import com.droitfacile.auth.AuthDtos.RegisterRequest;
import com.droitfacile.auth.AuthDtos.RegistrationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestPart("data") RegisterRequest req,
                                                         @RequestPart(value = "contractFile", required = false) MultipartFile contractFile) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req, contractFile));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }
}
