package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryPageDTO {
    private ProjectResponseDTO projectDetails;
    private ProjectMetricsDTO metrics;
    private List<TaskResponseDTO> tasks;
    private List<SprintResponseDTO> sprints;
    private List<PageSummaryResponseDto> pages;
    private List<MilestoneResponseDTO> milestones;
    private List<TeamMemberResponseDTO> members;
}
