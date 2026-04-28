package com.planora.backend.controller;

import com.planora.backend.dto.SummaryPageDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.SummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/dashboard-summary")
@RequiredArgsConstructor
@Tag(name = "Dashboard Summary", description = "BFF endpoints for the project summary page")
public class SummaryController {

    private final SummaryService summaryService;

    // Fetches the aggregated dashboard summary data in a single optimized request (BFF Pattern).
    @Operation(summary = "Get aggregated dashboard summary data")
    @GetMapping
    public ResponseEntity<SummaryPageDTO> getDashboardSummary(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(summaryService.getDashboardSummary(projectId, principal.getUserId()));
    }
}
