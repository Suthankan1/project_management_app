package com.planora.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "github_automation_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GithubAutomationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_id", nullable = false)
    private Long ruleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GithubTrigger trigger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GithubAction action;

    @Column(name = "event_context", nullable = false, columnDefinition = "TEXT")
    private String context;

    @Column(nullable = false, length = 20)
    private String outcome;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;
}
