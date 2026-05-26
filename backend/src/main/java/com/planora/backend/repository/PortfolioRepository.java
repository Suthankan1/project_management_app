package com.planora.backend.repository;

import com.planora.backend.model.Portfolio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    @EntityGraph(attributePaths = {"owner", "projects"})
    List<Portfolio> findByOwner_UserId(Long userId);

    @EntityGraph(attributePaths = {"owner", "projects", "projects.owner", "projects.team"})
    @Query("SELECT p FROM Portfolio p WHERE p.id = :id")
    Optional<Portfolio> findByIdWithProjects(@Param("id") Long id);
}
