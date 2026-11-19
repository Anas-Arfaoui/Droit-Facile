package com.droitfacile.clause;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ClauseRepository extends JpaRepository<Clause, Long> {

    List<Clause> findByContratIdOrderByIdAsc(Long contratId);

    @Transactional
    void deleteByContratId(Long contratId);
}
