package com.planora.backend.repository;

import com.planora.backend.model.GithubCommit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GithubCommitRepository extends JpaRepository<GithubCommit, Long> {

    Page<GithubCommit> findByIntegrationIdIn(List<Long> integrationIds, Pageable pageable);

    Optional<GithubCommit> findByIntegrationIdAndSha(Long integrationId, String sha);

    List<GithubCommit> findByLinkedTaskId(Long taskId);

    long countByIntegrationIdIn(List<Long> integrationIds);
}
