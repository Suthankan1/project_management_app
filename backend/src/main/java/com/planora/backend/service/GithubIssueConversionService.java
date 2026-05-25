package com.planora.backend.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubLabelDTO;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.Kanban;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.model.Label;
import com.planora.backend.model.Priority;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.KanbanRepository;
import com.planora.backend.repository.TaskRepository;

@Service
public class GithubIssueConversionService {

    private static final Logger log = LoggerFactory.getLogger(GithubIssueConversionService.class);
    private static final int MAX_LABEL_NAME_LENGTH = 50;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private KanbanRepository kanbanRepository;

    @Autowired
    private KanbanColumnRepository kanbanColumnRepository;

    @Autowired
    private LabelService labelService;

    public Task convertIssueToTask(GithubIssueDTO issue, Project project) {
        Task task = new Task();
        task.setProject(project);
        task.setTitle(truncate("[GH-#" + issue.getNumber() + "] " + nullToEmpty(issue.getTitle()), 255));
        task.setDescription(truncate(issue.getBody(), 2000));
        task.setStatus(findStatus(issue.getState(), project.getId()));
        task.setPriority(Priority.MEDIUM);
        task.setGithubIssueNumber(issue.getNumber() == null ? null : issue.getNumber().longValue());
        task.setGithubRepoFullName(extractRepoFullName(issue.getHtmlUrl()));
        task.setCreatedAt(toLocalDateTime(issue.getCreatedAt()));

        task.getLabels().addAll(mapGithubLabels(issue.getLabels(), project));
        return task;
    }

    public List<Label> mapGithubLabels(List<GithubLabelDTO> githubLabels, Project project) {
        if (githubLabels == null) {
            return List.of();
        }
        return githubLabels.stream()
                .filter(label -> label.getName() != null && !label.getName().isBlank())
                .map(label -> labelService.findOrCreate(
                        truncateLabelName(label.getName()), normalizeColor(label.getColor()), project))
                .toList();
    }

    public boolean isAlreadyImported(Long issueNumber, String repoFullName, Long projectId) {
        return taskRepository.existsByProjectIdAndGithubIssueNumberAndGithubRepoFullNameIgnoreCase(
                projectId, issueNumber, repoFullName);
    }

    private String findStatus(String issueState, Long projectId) {
        Kanban board = kanbanRepository.findByProjectId(projectId).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Kanban board not found for project"));
        List<KanbanColumn> columns = kanbanColumnRepository.findByKanbanIdOrderByPosition(board.getId());
        if (columns.isEmpty()) {
            throw new ResourceNotFoundException("Kanban column not found for project");
        }
        return "closed".equalsIgnoreCase(issueState)
                ? columns.get(columns.size() - 1).getStatus()
                : columns.get(0).getStatus();
    }

    private String extractRepoFullName(String htmlUrl) {
        if (htmlUrl == null || htmlUrl.isBlank()) {
            return null;
        }
        try {
            String[] parts = new URI(htmlUrl).getPath().split("/");
            if (parts.length >= 3 && !parts[1].isBlank() && !parts[2].isBlank()) {
                return parts[1] + "/" + parts[2];
            }
        } catch (URISyntaxException ignored) {
            return null;
        }
        return null;
    }

    private String normalizeColor(String color) {
        if (color == null || color.isBlank()) {
            return color;
        }
        return color.startsWith("#") ? color : "#" + color;
    }

    private String truncateLabelName(String name) {
        if (name.length() <= MAX_LABEL_NAME_LENGTH) {
            return name;
        }
        log.warn("GitHub label name exceeds {} characters and will be truncated: {}", MAX_LABEL_NAME_LENGTH, name);
        return name.substring(0, MAX_LABEL_NAME_LENGTH);
    }

    private java.time.LocalDateTime toLocalDateTime(OffsetDateTime value) {
        return value == null ? null : value.toLocalDateTime();
    }

    private String truncate(String value, int maxLength) {
        return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
