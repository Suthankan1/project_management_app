package com.planora.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_pull_requests",
    uniqueConstraints = @UniqueConstraint(columnNames = {"integration_id", "github_pr_number"}))
@AllArgsConstructor
@NoArgsConstructor
public class GithubPullRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private GithubIntegration integration;

    @Column(name = "github_pr_number", nullable = false)
    private Integer githubPrNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false, length = 20)
    private String state;

    @Column(name = "author_login")
    private String authorLogin;

    @Column(name = "head_branch")
    private String headBranch;

    @Column(name = "base_branch")
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

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt = LocalDateTime.now();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GithubPullRequest that = (GithubPullRequest) o;
        return java.util.Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(id);
    }
}
