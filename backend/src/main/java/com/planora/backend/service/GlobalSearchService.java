package com.planora.backend.service;

import com.planora.backend.dto.GlobalSearchResponseDTO;
import com.planora.backend.model.*;
import com.planora.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GlobalSearchService {
    private static final int SEARCH_LIMIT = 5;
    private static final int MESSAGE_EXCERPT_RADIUS = 45;
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final TaskRepository taskRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
        private final ProjectRepository projectRepository;

        @PersistenceContext
        private EntityManager entityManager;

    /**
     * Global search across tasks, documents, and members.
     * Query filter: searches tasks by title/description, documents by title, members by name/email.
     * ProjectId filter: if provided, limits to tasks and documents in that project.
     */
    public GlobalSearchResponseDTO search(String query, Long projectId, Long currentUserId) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.length() < 2) {
            return GlobalSearchResponseDTO.builder()
                    .tasks(List.of())
                    .documents(List.of())
                    .members(List.of())
                    .projects(List.of())
                    .messages(List.of())
                    .build();
        }

        List<Long> projectIds = resolveProjectScope(projectId, currentUserId);
        if (projectIds.isEmpty()) {
            return GlobalSearchResponseDTO.builder()
                    .tasks(List.of())
                    .documents(List.of())
                    .members(List.of())
                    .projects(List.of())
                    .messages(List.of())
                    .build();
        }

        // Search tasks - visible to user in accessible projects
        List<GlobalSearchResponseDTO.TaskSearchResultDTO> tasks = searchTasks(
                normalizedQuery, projectIds);

        // Search documents - visible to user in accessible projects
        List<GlobalSearchResponseDTO.DocumentSearchResultDTO> documents = searchDocuments(
                normalizedQuery, projectIds);

        // Search members - across the system (members current user can see)
        List<GlobalSearchResponseDTO.MemberSearchResultDTO> members = searchMembers(
                normalizedQuery, projectIds);

        // Search projects (boards) - visible to user
        List<GlobalSearchResponseDTO.ProjectSearchResultDTO> projects = searchProjects(
                normalizedQuery, projectIds);

        // Search chat messages by message content
        List<GlobalSearchResponseDTO.MessageSearchResultDTO> messages = searchMessages(
                normalizedQuery, projectIds);

        return GlobalSearchResponseDTO.builder()
                .tasks(tasks)
                .documents(documents)
                .members(members)
                .projects(projects)
                .messages(messages)
                .build();
    }

    /**
     * Search tasks by title or description.
     */
    private List<GlobalSearchResponseDTO.TaskSearchResultDTO> searchTasks(
            String query, List<Long> projectIds) {
        List<Task> results = entityManager.createQuery(
                        "SELECT t FROM Task t " +
                                "LEFT JOIN FETCH t.project p " +
                                "WHERE t.project.id IN :projectIds " +
                                "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')) " +
                                "OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))) " +
                                "ORDER BY t.updatedAt DESC",
                        Task.class)
                .setParameter("projectIds", projectIds)
                .setParameter("q", query)
                .setMaxResults(5)
                .getResultList();

        return results.stream()
                .map(task -> GlobalSearchResponseDTO.TaskSearchResultDTO.builder()
                        .id(task.getId())
                        .title(task.getTitle())
                        .subtitle(task.getProject().getName() + " • " + Objects.toString(task.getStatus(), "UNKNOWN"))
                        .projectName(task.getProject().getName())
                        .status(Objects.toString(task.getStatus(), "UNKNOWN"))
                        .url("/backlog?projectId=" + task.getProject().getId() + "&taskId=" + task.getId())
                        .type(GlobalSearchResponseDTO.SearchResultType.TASK)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Search documents by title.
     */
    private List<GlobalSearchResponseDTO.DocumentSearchResultDTO> searchDocuments(
            String query, List<Long> projectIds) {
        List<Document> results = entityManager.createQuery(
                        "SELECT d FROM Document d " +
                                "LEFT JOIN FETCH d.project p " +
                                "WHERE d.project.id IN :projectIds " +
                                "AND LOWER(d.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
                                "ORDER BY d.updatedAt DESC",
                        Document.class)
                .setParameter("projectIds", projectIds)
                .setParameter("q", query)
                .setMaxResults(5)
                .getResultList();

        return results.stream()
                .map(doc -> GlobalSearchResponseDTO.DocumentSearchResultDTO.builder()
                        .id(doc.getId())
                        .title(doc.getName())
                        .subtitle(doc.getProject().getName())
                        .url("/folders?projectId=" + doc.getProject().getId() + "&documentId=" + doc.getId())
                        .type(GlobalSearchResponseDTO.SearchResultType.DOCUMENT)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Search members by name or email.
     */
    private List<GlobalSearchResponseDTO.MemberSearchResultDTO> searchMembers(
            String query, List<Long> projectIds) {
        List<TeamMember> teamMembers = entityManager.createQuery(
                        "SELECT tm FROM TeamMember tm " +
                                "LEFT JOIN FETCH tm.user u " +
                                "WHERE tm.team.id IN (SELECT p.team.id FROM Project p WHERE p.id IN :projectIds) " +
                                "AND (LOWER(COALESCE(tm.user.fullName, tm.user.username)) LIKE LOWER(CONCAT('%', :q, '%')) " +
                                "OR LOWER(tm.user.email) LIKE LOWER(CONCAT('%', :q, '%'))) " +
                                "ORDER BY tm.user.username ASC",
                        TeamMember.class)
                .setParameter("projectIds", projectIds)
                .setParameter("q", query)
                .setMaxResults(5)
                .getResultList();

        return teamMembers.stream()
                .map(tm -> GlobalSearchResponseDTO.MemberSearchResultDTO.builder()
                        .id(tm.getUser().getUserId())
                        .name(tm.getUser().getFullName() != null && !tm.getUser().getFullName().isBlank()
                                ? tm.getUser().getFullName()
                                : tm.getUser().getUsername())
                        .subtitle(tm.getRole().name() + " • " + tm.getUser().getEmail())
                        .url("/profile?userId=" + tm.getUser().getUserId())
                        .type(GlobalSearchResponseDTO.SearchResultType.MEMBER)
                        .build())
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Search projects by name.
     */
    private List<GlobalSearchResponseDTO.ProjectSearchResultDTO> searchProjects(
            String query, List<Long> projectIds) {
        List<Project> projects = entityManager.createQuery(
                        "SELECT p FROM Project p " +
                                "WHERE p.id IN :projectIds " +
                                "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) " +
                                "ORDER BY p.updatedAt DESC",
                        Project.class)
                .setParameter("projectIds", projectIds)
                .setParameter("q", query)
                .setMaxResults(5)
                .getResultList();

        return projects.stream()
                .map(p -> GlobalSearchResponseDTO.ProjectSearchResultDTO.builder()
                        .id(p.getId())
                        .title(p.getName())
                        .subtitle(p.getType().name() + " Project")
                        .url("/summary/" + p.getId())
                        .type(GlobalSearchResponseDTO.SearchResultType.PROJECT)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Search chat messages by content.
     */
    private List<GlobalSearchResponseDTO.MessageSearchResultDTO> searchMessages(
            String query, List<Long> projectIds) {
        List<Object[]> results = entityManager.createQuery(
                        "SELECT m, COALESCE(NULLIF(u.fullName, ''), NULLIF(u.username, ''), m.sender) " +
                                "FROM ChatMessage m " +
                                "LEFT JOIN User u ON (LOWER(u.username) = LOWER(m.sender) OR LOWER(u.email) = LOWER(m.sender)) " +
                                "WHERE m.projectId IN :projectIds " +
                                "AND m.parentMessageId IS NULL " +
                                "AND COALESCE(m.deleted, false) = false " +
                                "AND LOWER(COALESCE(m.content, '')) LIKE LOWER(CONCAT('%', :q, '%')) " +
                                "ORDER BY m.timestamp DESC",
                        Object[].class)
                .setParameter("projectIds", projectIds)
                .setParameter("q", query)
                .setMaxResults(SEARCH_LIMIT)
                .getResultList();

        return results.stream()
                .map(row -> {
                    ChatMessage message = (ChatMessage) row[0];
                    String senderName = Objects.toString(row[1], message.getSender());
                    Long roomOrProjectId = message.getRoomId() != null ? message.getRoomId() : message.getProjectId();

                    return GlobalSearchResponseDTO.MessageSearchResultDTO.builder()
                            .messageId(message.getId())
                            .highlightedContent(buildMessageExcerpt(message.getContent(), query))
                            .senderName(senderName)
                            .timestamp(message.getTimestamp() != null ? message.getTimestamp().format(TIMESTAMP_FORMATTER) : null)
                            .roomOrProjectId(roomOrProjectId)
                            .projectId(message.getProjectId())
                            .roomId(message.getRoomId())
                            .deepLinkUrl(buildMessageDeepLink(message))
                            .type(GlobalSearchResponseDTO.SearchResultType.MESSAGE)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String buildMessageDeepLink(ChatMessage message) {
        StringBuilder deepLink = new StringBuilder("/project/")
                .append(message.getProjectId())
                .append("/chat?messageId=")
                .append(message.getId());

        if (message.getRoomId() != null) {
            deepLink.append("&roomId=").append(message.getRoomId());
        } else if (message.getRecipient() != null && !message.getRecipient().isBlank()) {
            deepLink.append("&with=").append(message.getRecipient().toLowerCase());
        } else {
            deepLink.append("&view=team");
        }

        return deepLink.toString();
    }

    private String buildMessageExcerpt(String content, String query) {
        if (content == null || content.isBlank()) {
            return "";
        }
        if (query == null || query.isBlank()) {
            return content.length() <= 120 ? content : content.substring(0, 117) + "...";
        }

        String normalizedContent = content.toLowerCase();
        String normalizedQuery = query.toLowerCase();
        int hitIndex = normalizedContent.indexOf(normalizedQuery);
        if (hitIndex < 0) {
            return content.length() <= 120 ? content : content.substring(0, 117) + "...";
        }

        int start = Math.max(0, hitIndex - MESSAGE_EXCERPT_RADIUS);
        int end = Math.min(content.length(), hitIndex + query.length() + MESSAGE_EXCERPT_RADIUS);
        String snippet = content.substring(start, end).replace('\n', ' ').trim();

        if (start > 0) {
            snippet = "..." + snippet;
        }
        if (end < content.length()) {
            snippet = snippet + "...";
        }
        return snippet;
    }

    private List<Long> resolveProjectScope(Long projectId, Long userId) {
        // Find all teams the user belongs to
        List<Team> teams = teamMemberRepository.findByUserUserId(userId).stream()
            .map(TeamMember::getTeam)
            .collect(Collectors.toList());
            
        if (teams.isEmpty()) return List.of();
        
        // Single query for all projects in those teams
        List<Long> accessibleProjectIds = projectRepository.findByTeamIn(teams).stream()
                .map(Project::getId)
                .distinct()
                .collect(Collectors.toList());

        if (projectId == null) {
            return accessibleProjectIds;
        }

        return accessibleProjectIds.contains(projectId) ? List.of(projectId) : List.of();
    }
}
