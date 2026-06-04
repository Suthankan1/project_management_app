package com.planora.backend.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class PageSummaryResponseDto {
    private Long id;
    private String title;
    private String updatedAt;
    private String updatedByUsername;
    private Long parentPageId;
    private Boolean isStarred;
    private String lastViewedAt;
    private Integer sortOrder;
    private String icon;
    private String cover;
}
