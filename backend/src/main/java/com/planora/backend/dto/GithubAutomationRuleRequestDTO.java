package com.planora.backend.dto;

import java.util.LinkedHashMap;
import java.util.Map;

import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubTrigger;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GithubAutomationRuleRequestDTO {

    @NotNull
    private GithubTrigger trigger;

    @NotNull
    private GithubAction action;

    private Map<String, String> config = new LinkedHashMap<>();
}
