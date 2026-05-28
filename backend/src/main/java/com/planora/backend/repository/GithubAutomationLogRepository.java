package com.planora.backend.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.planora.backend.model.GithubAutomationLog;

@Repository
public interface GithubAutomationLogRepository extends JpaRepository<GithubAutomationLog, Long> {

    @Query("""
            SELECT l FROM GithubAutomationLog l
            WHERE l.ruleId IN (
                SELECT r.id FROM GithubAutomationRule r WHERE r.project.id = :projectId
            )
            ORDER BY l.executedAt DESC, l.id DESC
            """)
    List<GithubAutomationLog> findRecentByProjectId(@Param("projectId") Long projectId, Pageable pageable);
}
