package com.planora.backend.service;

import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.model.*;
import com.planora.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardRecentServiceTest {

    @Mock
    private TeamMemberRepository teamMemberRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectAccessRepository projectAccessRepository;
    @Mock
    private ProjectFavoriteRepository projectFavoriteRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardRecentService dashboardRecentService;

    private User user;
    private Project project;
    private Team team;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setUsername("testuser");

        team = new Team();
        team.setId(10L);
        team.setName("Team Alpha");

        project = new Project();
        project.setId(100L);
        project.setName("Project Planora");
        project.setProjectKey("PLN");
        project.setTeam(team);
        project.setOwner(user);
    }

    @Test
    void getRecentProjects_returnsSortedProjects() {
        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setJoinedAt(LocalDateTime.now().minusDays(5));

        ProjectAccess access = new ProjectAccess();
        access.setProject(project);
        access.setLastAccessedAt(LocalDateTime.now().minusHours(2));

        when(teamMemberRepository.findByUserUserId(1L)).thenReturn(List.of(member));
        when(projectRepository.findByTeamIn(any())).thenReturn(List.of(project));
        when(projectAccessRepository.findByUser_UserIdOrderByLastAccessedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(access));
        when(userRepository.getReferenceById(1L)).thenReturn(user);

        List<ProjectResponseDTO> result = dashboardRecentService.getRecentProjects(1L, 5);

        assertEquals(1, result.size());
        assertEquals("Project Planora", result.get(0).getName());
        assertEquals(100L, result.get(0).getId());
    }

    @Test
    void getFavoriteProjects_returnsOnlyStarredProjects() {
        ProjectFavorite favorite = new ProjectFavorite();
        favorite.setProject(project);
        favorite.setCreatedAt(LocalDateTime.now());

        TeamMember member = new TeamMember();
        member.setTeam(team);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(teamMemberRepository.findByUserUserId(1L)).thenReturn(List.of(member));
        when(projectRepository.findByTeamIn(any())).thenReturn(List.of(project));
        when(projectFavoriteRepository.findByUserOrderByCreatedAtDesc(any())).thenReturn(List.of(favorite));

        List<ProjectResponseDTO> result = dashboardRecentService.getFavoriteProjects(1L);

        assertEquals(1, result.size());
        assertEquals(true, result.get(0).getIsFavorite());
    }
}
