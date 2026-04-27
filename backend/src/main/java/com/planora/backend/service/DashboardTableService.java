package com.planora.backend.service;

import com.planora.backend.dto.DashboardBoardDTO;
import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.dto.TaskResponseDTO;
import com.planora.backend.model.*;
import com.planora.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handles all data for the "Dashboard Table" section (the five tabs).
 * Tabs: Worked On, Viewed, Assigned to Me, Favorites, Boards.
 * Each tab fetches a different data set from the database.
 */
@Service
@RequiredArgsConstructor
public class DashboardTableService {

    private final TaskService taskService;
    private final SprintboardService sprintboardService;
    private final ProjectService projectService;

    // Default number of items shown in each dashboard tab
    private static final int DEFAULT_LIMIT = 20;

    // Returns tasks the user has recently worked on (last updated)
    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getWorkedOnTasks(Long userId) {
        return taskService.getWorkedOnTasks(userId, DEFAULT_LIMIT);
    }

    // Returns tasks the user has recently viewed (opened)
    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getViewedTasks(Long userId) {
        return taskService.getRecentTasks(userId, DEFAULT_LIMIT);
    }

    // Returns tasks that are currently assigned to the user
    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getAssignedTasks(Long userId) {
        return taskService.getAssignedTasks(userId, DEFAULT_LIMIT);
    }

    // Returns the user's favorite (starred) projects for the Favorites tab
    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getFavoriteProjects(Long userId) {
        return projectService.getFavoriteProjectsForUser(userId);
    }

    // Returns the sprint boards the user has recently visited (Boards tab)
    @Transactional(readOnly = true)
    public List<DashboardBoardDTO> getRecentBoards(Long userId) {
        return sprintboardService.getRecentSprintboardsForUser(userId, DEFAULT_LIMIT);
    }
}
