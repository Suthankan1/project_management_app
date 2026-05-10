package com.planora.backend.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class PageDetailResponseDto {
    private Long id;
    private Long projectId;
    private String title;
    private String content;
    private Long createdByUserId;
    private String createdByUsername;
    private Long updatedByUserId;
    private String updatedByUsername;
    private String createdAt;
    private String updatedAt;
}
