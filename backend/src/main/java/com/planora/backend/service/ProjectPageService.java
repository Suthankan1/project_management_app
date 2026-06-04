package com.planora.backend.service;

import com.planora.backend.dto.PageDetailResponseDto;
import com.planora.backend.dto.PageRequestDto;
import com.planora.backend.dto.PageSummaryResponseDto;
import com.planora.backend.dto.PageVersionResponseDto;
import com.planora.backend.model.Project;
import com.planora.backend.model.ProjectPage;
import com.planora.backend.model.ProjectPageVersion;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.TeamRole;
import com.planora.backend.repository.ProjectPageRepository;
import com.planora.backend.repository.ProjectPageVersionRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TeamMemberRepository;
import com.planora.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

// Manages rich-text documentation pages (like a Wiki) attached to a Project.
@Service
@RequiredArgsConstructor
public class ProjectPageService {

    private final ProjectPageRepository repository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProjectPageVersionRepository versionRepository;

    @Transactional
    public PageDetailResponseDto createPage(Long projectId, PageRequestDto request, Long userId) {
        Objects.requireNonNull(projectId, "projectId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        ProjectPage page = ProjectPage.builder()
                .projectId(projectId)
                .title(request.getTitle())
                .content(request.getContent())
                .createdByUserId(userId)
                .updatedByUserId(userId)
                .build();

        ProjectPage saved = repository.save(page);

        // Save version 1 immediately on page creation
        ProjectPageVersion firstVersion = ProjectPageVersion.builder()
                .pageId(saved.getId())
                .title(saved.getTitle())
                .content(saved.getContent())
                .authorId(userId)
                .versionNumber(1)
                .build();
        versionRepository.save(firstVersion);

        notifyProjectOwnersAndAdminsOnCreate(project, userId, saved);
        return toDetailDto(saved);
    }

    /*
     * Retrieves a lightweight list of pages for the sidebar navigation.
     * We purposefully DO NOT load the `content` field here to save database memory and bandwidth.
     */
    @Transactional(readOnly = true)
    public List<PageSummaryResponseDto> getProjectPages(Long projectId, Long userId) {
        Objects.requireNonNull(projectId, "projectId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        return repository.findByProjectId(projectId).stream()
                .sorted(Comparator.comparing(ProjectPage::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    /*
     * Retrieves the full rich-text content of a specific page when the user clicks on it.
     */
    @Transactional(readOnly = true)
    public PageDetailResponseDto getPageById(Long pageId, Long userId) {
        Objects.requireNonNull(pageId, "pageId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        ProjectPage page = findPage(pageId);
        Project project = findProject(page.getProjectId());
        validateProjectMembership(project.getTeam().getId(), userId, false);

        return toDetailDto(page);
    }

    @Transactional
    public PageDetailResponseDto updatePage(Long pageId, PageRequestDto request, Long userId) {
        Objects.requireNonNull(pageId, "pageId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        ProjectPage existingPage = findPage(pageId);
        Project project = findProject(existingPage.getProjectId());

        // Security Check: Viewers can read pages, but they cannot edit them.
        validateProjectMembership(project.getTeam().getId(), userId, true);

        // Fetch latest version before save to check throttling
        ProjectPageVersion latest = versionRepository.findFirstByPageIdOrderByVersionNumberDesc(pageId);

        // Step 1: Snapshot old data to determine if we need to send notifications.
        String oldTitle = existingPage.getTitle();
        Long oldUpdatedByUserId = existingPage.getUpdatedByUserId();

        // Step 2: Apply updates.
        existingPage.setTitle(request.getTitle());
        existingPage.setContent(request.getContent());
        existingPage.setUpdatedByUserId(userId);

        ProjectPage updatedPage = repository.save(existingPage);

        // Versioning Throttling Logic
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (latest == null) {
            ProjectPageVersion firstVersion = ProjectPageVersion.builder()
                    .pageId(pageId)
                    .title(updatedPage.getTitle())
                    .content(updatedPage.getContent())
                    .authorId(userId)
                    .versionNumber(1)
                    .build();
            versionRepository.save(firstVersion);
        } else {
            boolean sameUser = Objects.equals(latest.getAuthorId(), userId);
            boolean withinWindow = latest.getCreatedAt().isAfter(now.minusMinutes(5));

            if (sameUser && withinWindow) {
                // Throttle: Update the existing latest version
                latest.setTitle(updatedPage.getTitle());
                latest.setContent(updatedPage.getContent());
                latest.setCreatedAt(now);
                versionRepository.save(latest);
            } else {
                // Spawn a new version
                ProjectPageVersion nextVersion = ProjectPageVersion.builder()
                        .pageId(pageId)
                        .title(updatedPage.getTitle())
                        .content(updatedPage.getContent())
                        .authorId(userId)
                        .versionNumber(latest.getVersionNumber() + 1)
                        .build();
                versionRepository.save(nextVersion);
            }
        }

        if (!Objects.equals(oldTitle, updatedPage.getTitle())) {
            notifyImpactedStakeholdersOnRename(project, updatedPage, userId, oldTitle, oldUpdatedByUserId);
        }

        return toDetailDto(updatedPage);
    }

    @Transactional
    public void deletePage(Long pageId, Long userId) {
        Objects.requireNonNull(pageId, "pageId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        ProjectPage existingPage = findPage(pageId);
        Project project = findProject(existingPage.getProjectId());

        // Viewers cannot delete pages.
        validateProjectMembership(project.getTeam().getId(), userId, true);

        notifyImpactedStakeholdersOnDelete(project, existingPage, userId);

        repository.delete(existingPage);

        messagingTemplate.convertAndSend(
            "/topic/project/" + project.getId() + "/pages",
            Map.of("type", "PAGE_DELETED", "pageId", pageId, "projectId", project.getId())
        );
    }

    // ── Notification Strategies ───────────────────────────────────────────────────

    /*
     * Alert Strategy: "Managerial Oversight"
     * When a page is created, we only notify Owners and Admins, keeping regular Members focused on their tasks.
     */
    private void notifyProjectOwnersAndAdminsOnCreate(Project project, Long actorUserId, ProjectPage page) {
        Set<TeamRole> roles = Set.of(TeamRole.OWNER, TeamRole.ADMIN);
        List<TeamMember> recipients = teamMemberRepository
                .findByTeamIdAndRoleIn(project.getTeam().getId(), roles);

        String actorName = resolveActorName(actorUserId);
        String message = actorName + " created page: " + page.getTitle();
        String link = "/pages/" + page.getId() + "?projectId=" + project.getId();

        recipients.stream()
                .map(TeamMember::getUser)
                .filter(Objects::nonNull)
                .filter(user -> !user.getUserId().equals(actorUserId))
                .forEach(user -> notificationService.createNotification(user, message, link));
    }

    /*
     * Alert Strategy: "Direct Stakeholders"
     * If a page is renamed, we only notify the person who originally created it,
     * and the person who last edited it. We don't spam the whole team.
     */
    private void notifyImpactedStakeholdersOnRename(Project project,
                                                    ProjectPage page,
                                                    Long actorUserId,
                                                    String oldTitle,
                                                    Long oldUpdatedByUserId) {
        Set<Long> recipientIds = new LinkedHashSet<>();
        if (page.getCreatedByUserId() != null) {
            recipientIds.add(page.getCreatedByUserId());
        }
        if (oldUpdatedByUserId != null) {
            recipientIds.add(oldUpdatedByUserId);
        }

        recipientIds.remove(actorUserId);
        if (recipientIds.isEmpty()) {
            return;
        }

        String actorName = resolveActorName(actorUserId);
        String before = oldTitle != null ? oldTitle : "Untitled";
        String after = page.getTitle() != null ? page.getTitle() : "Untitled";
        String message = actorName + " renamed page from \"" + before + "\" to \"" + after + "\"";
        String link = "/pages/" + page.getId() + "?projectId=" + project.getId();

        notifyUsersByIds(recipientIds, message, link);
    }

    /*
     * Alert Strategy: "Direct Stakeholders"
     * Tells the creator and last editor that their work has been deleted.
     */
    private void notifyImpactedStakeholdersOnDelete(Project project, ProjectPage page, Long actorUserId) {
        Set<Long> recipientIds = new LinkedHashSet<>();
        if (page.getCreatedByUserId() != null) {
            recipientIds.add(page.getCreatedByUserId());
        }
        if (page.getUpdatedByUserId() != null) {
            recipientIds.add(page.getUpdatedByUserId());
        }

        recipientIds.remove(actorUserId);
        if (recipientIds.isEmpty()) {
            return;
        }

        String actorName = resolveActorName(actorUserId);
        String message = actorName + " deleted page: " + page.getTitle();
        String link = "/pages?projectId=" + project.getId();
        notifyUsersByIds(recipientIds, message, link);
    }

    @Transactional
    public PageDetailResponseDto toggleStar(Long projectId, Long pageId, Long userId) {
        ProjectPage page = findPage(pageId);
        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        page.setIsStarred(page.getIsStarred() == null ? true : !page.getIsStarred());
        ProjectPage saved = repository.save(page);
        return toDetailDto(saved);
    }

    @Transactional
    public PageDetailResponseDto movePage(Long projectId, Long pageId, Long parentPageId, Long userId) {
        ProjectPage page = findPage(pageId);
        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, true); // Viewers cannot move pages

        if (parentPageId != null) {
            ProjectPage parentPage = findPage(parentPageId);
            if (!parentPage.getProjectId().equals(projectId)) {
                throw new IllegalArgumentException("Parent page must belong to the same project");
            }
            if (isDescendant(pageId, parentPageId)) {
                throw new IllegalArgumentException("Cannot move a page to one of its own subpages or itself");
            }
            page.setParentPageId(parentPageId);
        } else {
            page.setParentPageId(null);
        }

        ProjectPage saved = repository.save(page);
        return toDetailDto(saved);
    }

    private boolean isDescendant(Long pageId, Long potentialParentId) {
        if (pageId.equals(potentialParentId)) {
            return true;
        }
        ProjectPage current = repository.findById(potentialParentId).orElse(null);
        while (current != null && current.getParentPageId() != null) {
            if (current.getParentPageId().equals(pageId)) {
                return true;
            }
            current = repository.findById(current.getParentPageId()).orElse(null);
        }
        return false;
    }

    @Transactional
    public void markViewed(Long projectId, Long pageId, Long userId) {
        ProjectPage page = findPage(pageId);
        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        page.setLastViewedAt(java.time.LocalDateTime.now());
        repository.save(page);
    }

    @Transactional(readOnly = true)
    public List<PageSummaryResponseDto> getRecentPages(Long projectId, Long userId) {
        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        return repository.findTop5ByProjectIdAndLastViewedAtIsNotNullOrderByLastViewedAtDesc(projectId).stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────────

    // Resolves the display name for notifications, preferring Full Name over Username.
    private String resolveActorName(Long actorUserId) {
        return userRepository.findById(actorUserId)
                .map(user -> user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getUsername())
                .orElse("A team member");
    }

    private void notifyUsersByIds(Set<Long> recipientIds, String message, String link) {
        userRepository.findAllById(recipientIds)
                .forEach(user -> notificationService.createNotification(user, message, link));
    }

    private ProjectPage findPage(Long pageId) {
        Objects.requireNonNull(pageId, "pageId cannot be null");
        return repository.findById(pageId)
                .orElseThrow(() -> new EntityNotFoundException("Page not found with ID: " + pageId));
    }

    private Project findProject(Long projectId) {
        Objects.requireNonNull(projectId, "projectId cannot be null");
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with ID: " + projectId));
    }

    /*
     * RBAC helper.
     * @param denyViewer If true, users with the "VIEWER" role will trigger an AccessDeniedException.
     */
    private void validateProjectMembership(Long teamId, Long userId, boolean denyViewer) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserUserId(teamId, userId)
                .orElseThrow(() -> new AccessDeniedException("User is not a member of this team"));

        if (denyViewer && member.getRole() == TeamRole.VIEWER) {
            throw new AccessDeniedException("Insufficient permission for this action");
        }
    }

    private PageSummaryResponseDto toSummaryDto(ProjectPage page) {
        PageSummaryResponseDto dto = new PageSummaryResponseDto();
        dto.setId(page.getId());
        dto.setTitle(page.getTitle());
        dto.setUpdatedAt(page.getUpdatedAt() != null ? page.getUpdatedAt().toString() : null);
        dto.setUpdatedByUsername(page.getUpdatedByUserId() != null ? resolveUsername(page.getUpdatedByUserId()) : null);
        dto.setParentPageId(page.getParentPageId());
        dto.setIsStarred(page.getIsStarred());
        dto.setLastViewedAt(page.getLastViewedAt() != null ? page.getLastViewedAt().toString() : null);
        dto.setSortOrder(page.getSortOrder());
        dto.setIcon(page.getIcon());
        dto.setCover(page.getCover());
        return dto;
    }

    private PageDetailResponseDto toDetailDto(ProjectPage page) {
        PageDetailResponseDto dto = new PageDetailResponseDto();
        dto.setId(page.getId());
        dto.setProjectId(page.getProjectId());
        dto.setTitle(page.getTitle());
        dto.setContent(page.getContent());
        dto.setCreatedByUserId(page.getCreatedByUserId());
        dto.setCreatedByUsername(page.getCreatedByUserId() != null ? resolveUsername(page.getCreatedByUserId()) : null);
        dto.setUpdatedByUserId(page.getUpdatedByUserId());
        dto.setUpdatedByUsername(page.getUpdatedByUserId() != null ? resolveUsername(page.getUpdatedByUserId()) : null);
        dto.setCreatedAt(page.getCreatedAt() != null ? page.getCreatedAt().toString() : null);
        dto.setUpdatedAt(page.getUpdatedAt() != null ? page.getUpdatedAt().toString() : null);
        dto.setParentPageId(page.getParentPageId());
        dto.setIsStarred(page.getIsStarred());
        dto.setLastViewedAt(page.getLastViewedAt() != null ? page.getLastViewedAt().toString() : null);
        dto.setSortOrder(page.getSortOrder());
        dto.setIcon(page.getIcon());
        dto.setCover(page.getCover());
        return dto;
    }

    private String resolveUsername(Long userId) {
        return userRepository.findById(userId)
                .map(u -> u.getUsername() != null ? u.getUsername() : u.getEmail())
                .orElse("Unknown");
    }

    @Transactional(readOnly = true)
    public List<PageVersionResponseDto> getPageVersions(Long projectId, Long pageId, Long userId) {
        Objects.requireNonNull(projectId, "projectId cannot be null");
        Objects.requireNonNull(pageId, "pageId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        ProjectPage page = findPage(pageId);
        if (!page.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Page does not belong to the specified project");
        }

        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, false);

        List<ProjectPageVersion> versions = versionRepository.findByPageIdOrderByVersionNumberDesc(pageId);
        return versions.stream()
                .map(v -> PageVersionResponseDto.builder()
                        .id(v.getId())
                        .pageId(v.getPageId())
                        .title(v.getTitle())
                        .content(v.getContent())
                        .versionNumber(v.getVersionNumber())
                        .authorId(v.getAuthorId())
                        .authorName(v.getAuthorId() != null ? resolveUsername(v.getAuthorId()) : "Unknown")
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public PageDetailResponseDto restorePageVersion(Long projectId, Long pageId, Long versionId, Long userId) {
        Objects.requireNonNull(projectId, "projectId cannot be null");
        Objects.requireNonNull(pageId, "pageId cannot be null");
        Objects.requireNonNull(versionId, "versionId cannot be null");
        Objects.requireNonNull(userId, "userId cannot be null");

        ProjectPage page = findPage(pageId);
        if (!page.getProjectId().equals(projectId)) {
            throw new IllegalArgumentException("Page does not belong to the specified project");
        }

        Project project = findProject(projectId);
        validateProjectMembership(project.getTeam().getId(), userId, true); // viewers cannot restore

        ProjectPageVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new EntityNotFoundException("Version not found with ID: " + versionId));

        if (!version.getPageId().equals(pageId)) {
            throw new IllegalArgumentException("Version does not belong to the specified page");
        }

        // Apply restore changes to page
        page.setTitle(version.getTitle());
        page.setContent(version.getContent());
        page.setUpdatedByUserId(userId);
        ProjectPage savedPage = repository.save(page);

        // Find the latest version number to increment
        ProjectPageVersion latest = versionRepository.findFirstByPageIdOrderByVersionNumberDesc(pageId);
        int nextVersionNumber = (latest != null) ? latest.getVersionNumber() + 1 : 1;

        // Force create a new version entry for the restored content (without throttling)
        ProjectPageVersion newVersion = ProjectPageVersion.builder()
                .pageId(pageId)
                .title(savedPage.getTitle())
                .content(savedPage.getContent())
                .authorId(userId)
                .versionNumber(nextVersionNumber)
                .build();
        versionRepository.save(newVersion);

        return toDetailDto(savedPage);
    }
}
