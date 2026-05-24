package com.planora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PortfolioDTO {

    @NotBlank(message = "Portfolio name is required")
    @Size(max = 100, message = "Name must be 100 characters or less")
    private String name;

    @Size(max = 500, message = "Description must be 500 characters or less")
    private String description;

    private String color;
    private String emoji;
    private List<Long> projectIds;
}
