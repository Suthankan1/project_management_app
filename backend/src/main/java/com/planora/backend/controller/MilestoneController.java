package com.planora.backend.controller;

import com.planora.backend.dto.MilestoneRequestDTO;
import com.planora.backend.dto.MilestoneResponseDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.MilestoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
// @Tag is used by Swagger/OpenAPI to group these endpoints cleanly in the generated API documentation UI.
@Tag(name = "Milestones", description = "Milestone management for projects")
public class MilestoneController {

    @Autowired
    private MilestoneService milestoneService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /*
     * DRY Helper Method.
     * Centralizes the casting logic for the Authentication object so we don't clutter
     * every single endpoint with boilerplate code.
     */
    private Long currentUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal up) {
            return up.getUserId();
        }
        throw new AccessDeniedException("Authentication required");
    }

    /*
     * Creates a new milestone.
     * API DESIGN: Nested under `/projects/{projectId}` because a milestone cannot
     * exist in a vacuum; it must be born inside a specific project context.
     */
    @Operation(summary = "Create a milestone for a project")
    @ApiResponse(responseCode = "200", description = "Milestone created")
    @PostMapping("/api/projects/{projectId}/milestones")
    public ResponseEntity<MilestoneResponseDTO> createMilestone(
            @PathVariable Long projectId,
            @Valid @RequestBody MilestoneRequestDTO dto,
            Authentication auth) {
        MilestoneResponseDTO milestone = milestoneService.createMilestone(projectId, dto, currentUserId(auth));
        broadcastMilestoneUpdate(milestone);
        return ResponseEntity.ok(milestone);
    }


    @Operation(summary = "Get all milestones for a project")
    @ApiResponse(responseCode = "200", description = "Success")
    @GetMapping("/api/projects/{projectId}/milestones")
    public ResponseEntity<List<MilestoneResponseDTO>> getMilestones(
            @PathVariable Long projectId,
            Authentication auth) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProject(projectId, currentUserId(auth)));
    }

    /*
     * Fetches a specific milestone.
     * API DESIGN: Uses Flat Routing (`/milestones/{milestoneId}`). Once the milestone
     * is created, its ID is globally unique in the database, so we no longer need
     * to force the frontend to pass the projectId in the URL.
     */
    @Operation(summary = "Get a single milestone")
    @GetMapping("/api/milestones/{milestoneId}")
    public ResponseEntity<MilestoneResponseDTO> getMilestone(
            @PathVariable Long milestoneId,
            Authentication auth) {
        return ResponseEntity.ok(milestoneService.getMilestoneById(milestoneId, currentUserId(auth)));
    }

    @Operation(summary = "Update a milestone")
    @PutMapping("/api/milestones/{milestoneId}")
    public ResponseEntity<MilestoneResponseDTO> updateMilestone(
            @PathVariable Long milestoneId,
            @Valid @RequestBody MilestoneRequestDTO dto,
            Authentication auth) {
        MilestoneResponseDTO milestone = milestoneService.updateMilestone(milestoneId, dto, currentUserId(auth));
        broadcastMilestoneUpdate(milestone);
        return ResponseEntity.ok(milestone);
    }

    /*
     * Deletes a milestone.
     * REST STANDARD: Returns 204 No Content.
     */
    @Operation(summary = "Delete a milestone")
    @DeleteMapping("/api/milestones/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(
            @PathVariable Long milestoneId,
            Authentication auth) {
        milestoneService.deleteMilestone(milestoneId, currentUserId(auth));
        return ResponseEntity.noContent().build();
    }

    /*
     * Links (or unlinks) a Task to a Milestone.
     * ARCHITECTURE NOTE: Why is this under `/tasks/{taskId}` instead of `/milestones/{milestoneId}`?
     * In database terms, the Task table holds the foreign key (`milestone_id`). Therefore,
     * assigning a milestone is technically an update to the Task resource.
     * We use @PatchMapping because we are partially updating the Task, not replacing it completely.
     */
    @Operation(summary = "Assign or remove a milestone from a task")
    @PatchMapping("/api/tasks/{taskId}/milestone")
    public ResponseEntity<Void> assignMilestone(
            @PathVariable Long taskId,
            // We accept a generic Map to handle nulls gracefully. If the frontend sends
            // { "milestoneId": null }, it means "Unlink this task from its current milestone".
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Object milestoneIdObj = body.get("milestoneId");
        Long milestoneId = milestoneIdObj != null
                ? Long.valueOf(milestoneIdObj.toString())
                : null;
        milestoneService.assignTaskToMilestone(taskId, milestoneId, currentUserId(auth));
        return ResponseEntity.ok().build();
    }

    private void broadcastMilestoneUpdate(MilestoneResponseDTO milestone) {
        messagingTemplate.convertAndSend(
                "/topic/project/" + milestone.getProjectId() + "/milestones",
                Map.of(
                        "type", "MILESTONE_UPDATED",
                        "milestone", milestone,
                        "projectId", milestone.getProjectId()
                )
        );
    }
}
