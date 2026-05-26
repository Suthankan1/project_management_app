package com.planora.backend.model;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "github_automation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GithubAutomationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GithubTrigger trigger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GithubAction action;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "github_automation_rule_config",
            joinColumns = @JoinColumn(name = "rule_id"))
    @MapKeyColumn(name = "config_key")
    @Column(name = "config_value", nullable = false)
    private Map<String, String> config = new LinkedHashMap<>();
}
