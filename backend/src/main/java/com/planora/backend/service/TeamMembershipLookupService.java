package com.planora.backend.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.planora.backend.model.TeamMember;
import com.planora.backend.repository.TeamMemberRepository;

import lombok.RequiredArgsConstructor;

// Separate service so @Cacheable proxy works correctly when called from other services.
@Service
@RequiredArgsConstructor
public class TeamMembershipLookupService {

    private final TeamMemberRepository teamMemberRepository;

    // Checks if a user is a member of a team; result is cached to avoid repeated DB hits.
    // "unless = null" prevents caching empty results (avoids memory waste from fake queries).
    @Cacheable(cacheNames = "team-member", key = "#teamId + ':' + #userId", unless = "#result == null")
    public TeamMember getTeamMember(Long teamId, Long userId) {
        return teamMemberRepository.findByTeamIdAndUserUserId(teamId, userId).orElse(null);
    }

    // Fetches memberships for multiple teams in one query instead of one query per team (avoids N+1 problem).
    public java.util.List<TeamMember> getTeamMembersForTeams(java.util.Set<Long> teamIds, Long userId) {
        // Skip the DB call if input is empty or invalid.
        if (teamIds == null || teamIds.isEmpty() || userId == null) {
            return java.util.List.of();
        }

        // Runs: SELECT * FROM team_members WHERE user_id = ? AND team_id IN (?, ?, ?)
        return teamMemberRepository.findByTeamIdInAndUserUserId(teamIds, userId);
    }
}
