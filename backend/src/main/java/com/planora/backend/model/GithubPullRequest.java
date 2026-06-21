package com.planora.backend.model;

import java.time.LocalDateTime;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "github_pull_requests",
        uniqueConstraints = @UniqueConstraint(columnNames = {"integration_id", "github_pr_number"}))
@NoArgsConstructor
public class GithubPullRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id")
    private GithubIntegration integration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @JsonIgnore
    private Task task;

    @Column(name = "github_pr_number")
    private Integer githubPrNumber;

    @Column(name = "pr_number")
    private int prNumber;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 20)
    private String state;

    @Column(name = "author_login")
    private String authorLogin;

    @Column(name = "head_branch", length = 255)
    private String headBranch;

    @Column(name = "base_branch", length = 255)
    private String baseBranch;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linked_task_id")
    private Long linkedTaskId;

    @Column(name = "github_created_at")
    private LocalDateTime githubCreatedAt;

    @Column(name = "github_updated_at")
    private LocalDateTime githubUpdatedAt;

    @Column(name = "merged_at")
    private LocalDateTime mergedAt;

    @Column(name = "github_merged_at")
    private LocalDateTime githubMergedAt;

    @Column(name = "html_url", length = 1000)
    private String htmlUrl;

    @Column(length = 255)
    private String author;

    @Column(name = "created_at", length = 30)
    private String createdAt;

    @Column(name = "head_sha", length = 40)
    private String headSha;

    @Column(name = "updated_at", length = 30)
    private String updatedAt;

    @Column(name = "ci_status", length = 20)
    private String ciStatus;

    @Column(name = "review_status", length = 30)
    private String reviewStatus;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt = LocalDateTime.now();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GithubPullRequest that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
