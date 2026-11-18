package com.droitfacile.audit;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void log(String utilisateur, String action, String entite, Long entiteId) {
        AuditLog log = new AuditLog();
        log.setUtilisateur(utilisateur);
        log.setAction(action);
        log.setEntite(entite);
        log.setEntiteId(entiteId);
        repository.save(log);
    }

    public List<AuditLog> findAll() {
        return repository.findAllByOrderByDateActionDesc();
    }
}
