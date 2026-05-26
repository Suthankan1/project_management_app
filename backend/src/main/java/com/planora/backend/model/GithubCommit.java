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
@Table(name = "github_commits",
        uniqueConstraints = @UniqueConstraint(columnNames = {"integration_id", "sha"}))
@NoArgsConstructor
public class GithubCommit {
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

    @Column(nullable = false, length = 40)
    private String sha;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_email")
    private String authorEmail;

    @Column(name = "commit_url")
    private String commitUrl;

    @Column(name = "linked_task_id")
    private Long linkedTaskId;

    @Column(name = "authored_at")
    private LocalDateTime authoredAt;

    @Column(length = 255)
    private String author;

    @Column(name = "committed_at", length = 30)
    private String committedAt;

    @Column(name = "html_url", length = 1000)
    private String htmlUrl;

    @Column(name = "ci_status", length = 20)
    private String ciStatus;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt = LocalDateTime.now();

    public GithubCommit(Long id, Task task, String sha, String message, String author,
            String committedAt, String htmlUrl, String ciStatus, LocalDateTime syncedAt) {
        this.id = id;
        this.task = task;
        this.sha = sha;
        this.message = message;
        this.author = author;
        this.committedAt = committedAt;
        this.htmlUrl = htmlUrl;
        this.ciStatus = ciStatus;
        this.syncedAt = syncedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GithubCommit that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
