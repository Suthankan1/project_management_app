package com.planora.backend.dto;

import java.util.Map;

import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubTrigger;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GithubAutomationRuleResponseDTO {
    private Long id;
    private Long projectId;
    private GithubTrigger trigger;
    private GithubAction action;
    private boolean enabled;
    private Map<String, String> config;
}
