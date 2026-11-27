package com.droitfacile.registration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRepository extends JpaRepository<RegistrationRequest, Long> {
    boolean existsByEmailAndStatus(String email, RegistrationStatus status);
    List<RegistrationRequest> findAllByOrderByCreeLeDesc();
}
