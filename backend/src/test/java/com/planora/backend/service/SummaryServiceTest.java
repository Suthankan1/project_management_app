package com.planora.backend.service;

import com.planora.backend.dto.*;
import com.planora.backend.model.Project;
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.TeamRole;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SummaryServiceTest {

    @Mock
    private ProjectService projectService;
    @Mock
    private TaskService taskService;
    @Mock
    private SprintService sprintService;
    @Mock
    private ProjectPageService projectPageService;
    @Mock
    private MilestoneService milestoneService;
    @Mock
    private TeamMemberService teamMemberService;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserService userService;
    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private SummaryService summaryService;

    private Long projectId;
    private Long userId;
    private Project mockProject;
    private Team mockTeam;
    private User mockUser;

    @BeforeEach
    public void setup() {
        projectId = 100L;
        userId = 1L;

        mockTeam = new Team();
        mockTeam.setId(10L);

        mockUser = new User();
        mockUser.setUserId(userId);
        mockUser.setUsername("testUser");

        mockProject = new Project();
        mockProject.setId(projectId);
        mockProject.setTeam(mockTeam);
    }

    @Test
    public void testGetDashboardSummary_Success() {
        // Mock Project Details
        ProjectResponseDTO projectResponse = ProjectResponseDTO.builder().id(projectId).name("Test Project").build();
        when(projectService.getProjectByIdForUser(projectId, userId)).thenReturn(projectResponse);

        // Mock Metrics
        ProjectMetricsDTO metricsDTO = ProjectMetricsDTO.builder().totalTasks(10L).build();
        when(projectService.getProjectMetrics(projectId)).thenReturn(metricsDTO);

        // Mock Tasks
        List<TaskResponseDTO> tasks = Collections.singletonList(new TaskResponseDTO());
        when(taskService.getTasksByProject(projectId, userId, null, null, null, null, null)).thenReturn(tasks);

        // Mock Sprints
        List<SprintResponseDTO> sprints = Collections.singletonList(new SprintResponseDTO());
        when(sprintService.getSprintsByProject(projectId, userId)).thenReturn(sprints);

        // Mock Pages
        List<PageSummaryResponseDto> pages = Collections.singletonList(new PageSummaryResponseDto());
        when(projectPageService.getProjectPages(projectId, userId)).thenReturn(pages);

        // Mock Milestones
        List<MilestoneResponseDTO> milestones = Collections.singletonList(new MilestoneResponseDTO());
        when(milestoneService.getMilestonesByProject(projectId, userId)).thenReturn(milestones);

        // Mock Members Validation & Fetching
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(mockProject));
        
        TeamMember mockTeamMember = new TeamMember();
        mockTeamMember.setId(1L);
        mockTeamMember.setUser(mockUser);
        mockTeamMember.setRole(TeamRole.MEMBER);
        
        when(teamMemberService.getTeamMembers(mockTeam.getId())).thenReturn(Collections.singletonList(mockTeamMember));
        when(taskRepository.countTasksByAssigneeUserIdsAndTeamId(any(), eq(mockTeam.getId()))).thenReturn(Collections.emptyList());
        when(userService.generatePresignedUrl(any())).thenReturn("http://presigned-url.com");

        // Act
        SummaryPageDTO summary = summaryService.getDashboardSummary(projectId, userId);

        // Assert
        assertNotNull(summary);
        assertEquals(projectId, summary.getProjectDetails().getId());
        assertEquals(10L, summary.getMetrics().getTotalTasks());
        assertEquals(1, summary.getTasks().size());
        assertEquals(1, summary.getSprints().size());
        assertEquals(1, summary.getPages().size());
        assertEquals(1, summary.getMilestones().size());
        assertEquals(1, summary.getMembers().size());
        assertEquals("testUser", summary.getMembers().get(0).getUser().getUsername());
    }
}
