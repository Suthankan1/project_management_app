package com.planora.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PageVersionResponseDto {
    private Long id;
    private Long pageId;
    private String title;
    private String content;
    private Integer versionNumber;
    private Long authorId;
    private String authorName;
    private LocalDateTime createdAt;
}
