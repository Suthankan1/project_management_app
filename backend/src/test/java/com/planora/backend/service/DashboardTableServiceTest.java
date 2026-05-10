package com.planora.backend.service;

import com.planora.backend.dto.DashboardBoardDTO;
import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.dto.TaskResponseDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardTableServiceTest {

    @Mock
    private TaskService taskService;
    @Mock
    private SprintboardService sprintboardService;
    @Mock
    private ProjectService projectService;

    @InjectMocks
    private DashboardTableService dashboardTableService;

    @Test
    void getWorkedOnTasks_callsTaskService() {
        TaskResponseDTO task = new TaskResponseDTO();
        task.setId(101L);
        when(taskService.getWorkedOnTasks(eq(1L), anyInt())).thenReturn(List.of(task));

        List<TaskResponseDTO> result = dashboardTableService.getWorkedOnTasks(1L);

        assertEquals(1, result.size());
        verify(taskService).getWorkedOnTasks(eq(1L), eq(20));
    }

    @Test
    void getRecentBoards_callsSprintboardService() {
        DashboardBoardDTO board = new DashboardBoardDTO(200L, "Sprint 1", 50L, "Project Alpha", null);
        when(sprintboardService.getRecentSprintboardsForUser(eq(1L), anyInt())).thenReturn(List.of(board));

        List<DashboardBoardDTO> result = dashboardTableService.getRecentBoards(1L);

        assertEquals(1, result.size());
        verify(sprintboardService).getRecentSprintboardsForUser(eq(1L), eq(20));
    }
}
