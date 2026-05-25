package com.planora.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PortfolioResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String color;
    private String emoji;
    private Long ownerId;
    private String ownerName;
    private int projectCount;
    private List<ProjectResponseDTO> projects;
    private Long totalTasks;
    private Long completedTasks;
    private Long overdueTasks;
    private Long totalMembers;
    private Integer healthScore;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
