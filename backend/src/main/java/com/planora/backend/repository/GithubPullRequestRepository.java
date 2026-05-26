package com.planora.backend.repository;

import com.planora.backend.model.GithubPullRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GithubPullRequestRepository extends JpaRepository<GithubPullRequest, Long> {

    Page<GithubPullRequest> findByIntegrationIdIn(List<Long> integrationIds, Pageable pageable);

    Page<GithubPullRequest> findByIntegrationIdInAndState(List<Long> integrationIds, String state, Pageable pageable);

    Optional<GithubPullRequest> findByIntegrationIdAndGithubPrNumber(Long integrationId, Integer githubPrNumber);

    List<GithubPullRequest> findByLinkedTaskId(Long taskId);

    long countByIntegrationIdIn(List<Long> integrationIds);

    long countByIntegrationIdInAndState(List<Long> integrationIds, String state);
}
