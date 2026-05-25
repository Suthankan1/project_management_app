package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.model.Kanban;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.model.Label;
import com.planora.backend.model.Priority;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.KanbanRepository;
import com.planora.backend.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class GithubIssueConversionServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private KanbanRepository kanbanRepository;
    @Mock
    private KanbanColumnRepository kanbanColumnRepository;
    @Mock
    private LabelService labelService;

    @InjectMocks
    private GithubIssueConversionService service;

    private Project project;
    private Kanban board;
    private KanbanColumn firstColumn;
    private KanbanColumn lastColumn;

    @BeforeEach
    void setUp() {
        project = new Project();
        project.setId(10L);
        board = new Kanban();
        board.setId(20L);
        firstColumn = new KanbanColumn();
        firstColumn.setStatus("TODO");
        lastColumn = new KanbanColumn();
        lastColumn.setStatus("DONE");
    }

    @Test
    void convertIssueToTask_mapsOpenIssueAndTruncatesContent() {
        OffsetDateTime createdAt = OffsetDateTime.parse("2026-05-25T05:15:00Z");
        GithubIssueDTO issue = issue(18, "open", "a".repeat(300), "b".repeat(2200));
        issue.setCreatedAt(createdAt);
        issue.setHtmlUrl("https://github.com/planora/app/issues/18");
        issue.setLabels(List.of(new GithubIssueDTO.LabelDTO("bug", "d73a4a")));
        Label label = new Label("bug", "#d73a4a", project);

        when(kanbanRepository.findByProjectId(10L)).thenReturn(List.of(board));
        when(kanbanColumnRepository.findByKanbanIdOrderByPosition(20L))
                .thenReturn(List.of(firstColumn, lastColumn));
        when(labelService.findOrCreate("bug", "#d73a4a", project)).thenReturn(label);

        Task task = service.convertIssueToTask(issue, project);

        assertEquals(255, task.getTitle().length());
        assertEquals("[GH-#18] ", task.getTitle().substring(0, 9));
        assertEquals(2000, task.getDescription().length());
        assertEquals("TODO", task.getStatus());
        assertEquals(Priority.MEDIUM, task.getPriority());
        assertEquals(18L, task.getGithubIssueNumber());
        assertEquals("planora/app", task.getGithubRepoFullName());
        assertEquals(createdAt.toLocalDateTime(), task.getCreatedAt());
        assertNull(task.getAssignee());
        assertEquals(1, task.getLabels().size());
    }

    @Test
    void convertIssueToTask_usesLastColumnForClosedIssueAndAllowsNullBody() {
        GithubIssueDTO issue = issue(19, "closed", "Fixed", null);
        issue.setHtmlUrl("https://github.com/planora/app/issues/19");

        when(kanbanRepository.findByProjectId(10L)).thenReturn(List.of(board));
        when(kanbanColumnRepository.findByKanbanIdOrderByPosition(20L))
                .thenReturn(List.of(firstColumn, lastColumn));

        Task task = service.convertIssueToTask(issue, project);

        assertEquals("[GH-#19] Fixed", task.getTitle());
        assertNull(task.getDescription());
        assertEquals("DONE", task.getStatus());
    }

    @Test
    void isAlreadyImported_checksIssueRepoAndProjectTogether() {
        when(taskRepository.existsByProjectIdAndGithubIssueNumberAndGithubRepoFullNameIgnoreCase(
                10L, 18L, "planora/app")).thenReturn(true);

        assertEquals(true, service.isAlreadyImported(18L, "planora/app", 10L));
        verify(taskRepository).existsByProjectIdAndGithubIssueNumberAndGithubRepoFullNameIgnoreCase(
                10L, 18L, "planora/app");
    }

    private GithubIssueDTO issue(Integer number, String state, String title, String body) {
        GithubIssueDTO issue = new GithubIssueDTO();
        issue.setNumber(number);
        issue.setState(state);
        issue.setTitle(title);
        issue.setBody(body);
        return issue;
    }
}
