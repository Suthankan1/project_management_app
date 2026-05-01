package com.planora.backend.service;

import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.model.*;
import com.planora.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handles all data for the "Recent Spaces" section of the dashboard.
 * This includes fetching recently accessed projects and favorite projects.
 */
@Service
@RequiredArgsConstructor
public class DashboardRecentService {

    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessRepository projectAccessRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final UserRepository userRepository;

    // Returns the most recently accessed projects for the user (up to the given limit)
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getRecentProjects(Long userId, int limit) {
        // Find all teams the user is a member of
        List<TeamMember> memberships = teamMemberRepository.findByUserUserId(userId);
        List<Team> userTeams = memberships.stream()
                .map(TeamMember::getTeam)
                .collect(Collectors.toList());

        if (userTeams.isEmpty()) return Collections.emptyList();

        // Load all projects visible to the user through their teams
        List<Project> allProjects = projectRepository.findByTeamIn(userTeams);

        // Build lookup maps once to avoid repeated DB queries per project
        Map<Long, LocalDateTime> teamJoinedMap = buildTeamJoinedMap(memberships);
        Map<Long, LocalDateTime> accessMap = buildAccessMap(userId);
        Map<Long, LocalDateTime> favoriteMap = buildFavoriteMap(userId);

        // Sort by the most recently accessed time and return only the top N results
        return allProjects.stream()
                .map(p -> toDto(p, userId, teamJoinedMap, accessMap, favoriteMap))
                .sorted((a, b) -> {
                    LocalDateTime t1 = a.getLastAccessedAt() != null ? a.getLastAccessedAt() : LocalDateTime.MIN;
                    LocalDateTime t2 = b.getLastAccessedAt() != null ? b.getLastAccessedAt() : LocalDateTime.MIN;
                    return t2.compareTo(t1); // Newest first
                })
                .limit(limit)
                .collect(Collectors.toList());
    }

    // Returns only the projects the user has starred as favorites
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getFavoriteProjects(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Determine which project IDs the user actually has access to (via team membership)
        List<TeamMember> memberships = teamMemberRepository.findByUserUserId(userId);
        List<Team> userTeams = memberships.stream().map(TeamMember::getTeam).collect(Collectors.toList());

        java.util.Set<Long> accessibleProjectIds = userTeams.isEmpty()
                ? Collections.emptySet()
                : projectRepository.findByTeamIn(userTeams)
                        .stream().map(Project::getId)
                        .collect(java.util.stream.Collectors.toSet());

        // Build lookup maps for efficient DTO construction
        Map<Long, LocalDateTime> teamJoinedMap = buildTeamJoinedMap(memberships);
        Map<Long, LocalDateTime> accessMap = buildAccessMap(userId);

        // Load the favorites and build the favorite timestamp map
        List<ProjectFavorite> favorites = projectFavoriteRepository.findByUserOrderByCreatedAtDesc(user);
        Map<Long, LocalDateTime> favoriteMap = favorites.stream()
                .collect(Collectors.toMap(f -> f.getProject().getId(), ProjectFavorite::getCreatedAt, (a, b) -> a));

        // Filter out favorites for projects the user no longer has access to
        return favorites.stream()
                .filter(fav -> accessibleProjectIds.contains(fav.getProject().getId()))
                .map(fav -> toDto(fav.getProject(), userId, teamJoinedMap, accessMap, favoriteMap))
                .collect(Collectors.toList());
    }

    // ── PRIVATE HELPERS ────────────────────────────────────────────────────────

    // Builds a map of teamId -> when the user joined that team
    private Map<Long, LocalDateTime> buildTeamJoinedMap(List<TeamMember> memberships) {
        return memberships.stream()
                .collect(Collectors.toMap(m -> m.getTeam().getId(), TeamMember::getJoinedAt, (a, b) -> a));
    }

    // Builds a map of projectId -> when the user last accessed that project
    private Map<Long, LocalDateTime> buildAccessMap(Long userId) {
        return projectAccessRepository
                .findByUser_UserIdOrderByLastAccessedAtDesc(userId, Pageable.unpaged())
                .stream()
                .collect(Collectors.toMap(a -> a.getProject().getId(), ProjectAccess::getLastAccessedAt, (a, b) -> a));
    }

    // Builds a map of projectId -> when the user marked it as a favorite
    private Map<Long, LocalDateTime> buildFavoriteMap(Long userId) {
        User userRef = userRepository.getReferenceById(userId);
        return projectFavoriteRepository.findByUserOrderByCreatedAtDesc(userRef)
                .stream()
                .collect(Collectors.toMap(f -> f.getProject().getId(), ProjectFavorite::getCreatedAt, (a, b) -> a));
    }

    // Converts a Project entity into a response DTO with user-specific metadata attached
    private ProjectResponseDTO toDto(Project project, Long userId,
            Map<Long, LocalDateTime> teamJoinedMap,
            Map<Long, LocalDateTime> accessMap,
            Map<Long, LocalDateTime> favoriteMap) {

        // Use last accessed time if available, otherwise fall back to team join time
        LocalDateTime lastAccessedAt = accessMap.getOrDefault(project.getId(),
                teamJoinedMap.get(project.getTeam().getId()));

        // Check if the user has this project marked as a favorite
        LocalDateTime favoriteMarkedAt = favoriteMap.get(project.getId());

        return ProjectResponseDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .projectKey(project.getProjectKey())
                .description(project.getDescription())
                .type(project.getType())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .ownerId(project.getOwner().getUserId())
                .ownerName(project.getOwner().getUsername())
                .teamId(project.getTeam().getId())
                .teamName(project.getTeam().getName())
                .isFavorite(favoriteMarkedAt != null)
                .favoriteMarkedAt(favoriteMarkedAt)
                .lastAccessedAt(lastAccessedAt)
                .build();
    }
}
