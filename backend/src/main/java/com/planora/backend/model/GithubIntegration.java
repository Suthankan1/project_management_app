package com.planora.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_integrations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "repository_full_name"}))
@AllArgsConstructor
@NoArgsConstructor
public class GithubIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "repository_full_name", nullable = false)
    private String repositoryFullName;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "encrypted_access_token", length = 512)
    private String encryptedAccessToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false)
    private TokenType tokenType = TokenType.PERSONAL_ACCESS_TOKEN;

    @Column(nullable = false)
    private boolean active = true;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum TokenType {
        PERSONAL_ACCESS_TOKEN, OAUTH, GITHUB_APP
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GithubIntegration that = (GithubIntegration) o;
        return java.util.Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(id);
    }
}
