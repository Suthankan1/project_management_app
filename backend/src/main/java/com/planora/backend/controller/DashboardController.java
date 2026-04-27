package com.planora.backend.controller;

import com.planora.backend.dto.DashboardBoardDTO;
import com.planora.backend.dto.ProjectResponseDTO;
import com.planora.backend.dto.TaskResponseDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.DashboardRecentService;
import com.planora.backend.service.DashboardTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Single controller for the entire dashboard page.
 * All endpoints here are only for the dashboard — no mixing with other features.
 *
 * API Endpoints:
 *   GET /api/dashboard/recent          -> Recent Spaces section
 *   GET /api/dashboard/favorites       -> Favorite Spaces section
 *   GET /api/dashboard/table/worked-on -> Table: Worked On tab
 *   GET /api/dashboard/table/viewed    -> Table: Viewed tab
 *   GET /api/dashboard/table/assigned  -> Table: Assigned to Me tab
 *   GET /api/dashboard/table/favorites -> Table: Favorites tab
 *   GET /api/dashboard/table/boards    -> Table: Boards tab
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    // Handles data for the Recent Spaces and Favorites carousels
    private final DashboardRecentService dashboardRecentService;

    // Handles data for each of the 5 table tabs
    private final DashboardTableService dashboardTableService;

    // ── RECENT SPACES SECTION ──────────────────────────────────────────────────

    // Returns the user's most recently accessed projects (for the top carousel)
    @GetMapping("/recent")
    public ResponseEntity<List<ProjectResponseDTO>> getRecentProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(
                dashboardRecentService.getRecentProjects(principal.getUserId(), limit));
    }

    // Returns the user's starred/favorite projects (for the carousel favorites filter)
    @GetMapping("/favorites")
    public ResponseEntity<List<ProjectResponseDTO>> getFavoriteProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardRecentService.getFavoriteProjects(principal.getUserId()));
    }

    // ── DASHBOARD TABLE SECTION (5 TABS) ──────────────────────────────────────

    // Tab 1: Tasks the user has recently worked on
    @GetMapping("/table/worked-on")
    public ResponseEntity<List<TaskResponseDTO>> getWorkedOnTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardTableService.getWorkedOnTasks(principal.getUserId()));
    }

    // Tab 2: Tasks the user has recently viewed (opened)
    @GetMapping("/table/viewed")
    public ResponseEntity<List<TaskResponseDTO>> getViewedTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardTableService.getViewedTasks(principal.getUserId()));
    }

    // Tab 3: Tasks currently assigned to the user
    @GetMapping("/table/assigned")
    public ResponseEntity<List<TaskResponseDTO>> getAssignedTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardTableService.getAssignedTasks(principal.getUserId()));
    }

    // Tab 4: User's favorite projects (shown in the Favorites tab of the table)
    @GetMapping("/table/favorites")
    public ResponseEntity<List<ProjectResponseDTO>> getTableFavorites(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardTableService.getFavoriteProjects(principal.getUserId()));
    }

    // Tab 5: Sprint boards the user has recently visited
    @GetMapping("/table/boards")
    public ResponseEntity<List<DashboardBoardDTO>> getRecentBoards(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                dashboardTableService.getRecentBoards(principal.getUserId()));
    }
}
