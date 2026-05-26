package com.planora.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.GithubTrigger;

@Repository
public interface GithubAutomationRuleRepository extends JpaRepository<GithubAutomationRule, Long> {

    List<GithubAutomationRule> findByProject_IdInAndTrigger(List<Long> projectIds, GithubTrigger trigger);
}
