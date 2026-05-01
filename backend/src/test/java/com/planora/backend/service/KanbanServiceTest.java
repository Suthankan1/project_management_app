package com.planora.backend.service;

import com.planora.backend.dto.KanbanBoardResponseDTO;
import com.planora.backend.dto.KanbanRequestDTO;
import com.planora.backend.model.Kanban;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.KanbanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KanbanServiceTest {

    @Mock
    private KanbanRepository kanbanRepository;

    @Mock
    private KanbanColumnRepository kanbanColumnRepository;

    @InjectMocks
    private KanbanService kanbanService;

    private Kanban testKanban;
    private KanbanRequestDTO kanbanRequestDTO;
    private KanbanColumn testColumn;

    @BeforeEach
    void setUp() {
        testKanban = new Kanban();
        testKanban.setId(1L);
        testKanban.setName("Test Kanban Board");
        testKanban.setProjectId(10L);

        kanbanRequestDTO = new KanbanRequestDTO();
        kanbanRequestDTO.setName("Test Kanban Board");
        kanbanRequestDTO.setProjectId(10L);

        testColumn = new KanbanColumn();
        testColumn.setId(1L);
        testColumn.setName("To Do");
        testColumn.setStatus("TODO");
        testColumn.setPosition(0);
        testColumn.setColor("#F3F4F6");
        testColumn.setWipLimit(0);
        testColumn.setKanban(testKanban);
    }

    @Test
    void createKanban_Success() {
        when(kanbanRepository.save(any(Kanban.class))).thenReturn(testKanban);

        Kanban result = kanbanService.createKanban(kanbanRequestDTO);

        assertNotNull(result);
        assertEquals("Test Kanban Board", result.getName());
        assertEquals(10L, result.getProjectId());
        verify(kanbanRepository, times(1)).save(any(Kanban.class));
    }

    @Test
    void createKanban_SetsCorrectProperties() {
        ArgumentCaptor<Kanban> kanbanCaptor = ArgumentCaptor.forClass(Kanban.class);
        when(kanbanRepository.save(any(Kanban.class))).thenReturn(testKanban);

        kanbanService.createKanban(kanbanRequestDTO);

        verify(kanbanRepository).save(kanbanCaptor.capture());
        Kanban captured = kanbanCaptor.getValue();
        assertEquals("Test Kanban Board", captured.getName());
        assertEquals(10L, captured.getProjectId());
    }

    @Test
    void getAllKanbans_ReturnsAllKanbans() {
        Kanban kanban2 = new Kanban();
        kanban2.setId(2L);
        kanban2.setName("Kanban 2");
        kanban2.setProjectId(20L);

        List<Kanban> kanbans = Arrays.asList(testKanban, kanban2);
        when(kanbanRepository.findAll()).thenReturn(kanbans);

        List<Kanban> result = kanbanService.getAllKanbans();

        assertEquals(2, result.size());
        assertEquals("Test Kanban Board", result.get(0).getName());
        verify(kanbanRepository, times(1)).findAll();
    }

    @Test
    void getAllKanbans_EmptyList() {
        when(kanbanRepository.findAll()).thenReturn(List.of());

        List<Kanban> result = kanbanService.getAllKanbans();

        assertTrue(result.isEmpty());
        verify(kanbanRepository, times(1)).findAll();
    }

    @Test
    void getKanbanById_Exists_ReturnsKanban() {
        when(kanbanRepository.findById(1L)).thenReturn(Optional.of(testKanban));

        Optional<Kanban> result = kanbanService.getKanbanById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test Kanban Board", result.get().getName());
        verify(kanbanRepository, times(1)).findById(1L);
    }

    @Test
    void getKanbanById_NotExists_ReturnsEmpty() {
        when(kanbanRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Kanban> result = kanbanService.getKanbanById(999L);

        assertFalse(result.isPresent());
    }

    @Test
    void updateKanban_Success() {
        Kanban updatedKanban = new Kanban();
        updatedKanban.setId(1L);
        updatedKanban.setName("Updated Kanban Board");
        updatedKanban.setProjectId(10L);

        KanbanRequestDTO updateDTO = new KanbanRequestDTO();
        updateDTO.setName("Updated Kanban Board");
        updateDTO.setProjectId(10L);

        when(kanbanRepository.findById(1L)).thenReturn(Optional.of(testKanban));
        when(kanbanRepository.save(any(Kanban.class))).thenReturn(updatedKanban);

        Kanban result = kanbanService.updateKanban(1L, updateDTO);

        assertEquals("Updated Kanban Board", result.getName());
        verify(kanbanRepository, times(1)).findById(1L);
        verify(kanbanRepository, times(1)).save(any(Kanban.class));
    }

    @Test
    void updateKanban_NotFound_ThrowsException() {
        when(kanbanRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> kanbanService.updateKanban(999L, kanbanRequestDTO));
        verify(kanbanRepository, times(1)).findById(999L);
        verify(kanbanRepository, never()).save(any(Kanban.class));
    }

    @Test
    void deleteKanban_Success() {
        doNothing().when(kanbanRepository).deleteById(1L);

        kanbanService.deleteKanban(1L);

        verify(kanbanRepository, times(1)).deleteById(1L);
    }

    @Test
    void getKanbansByProjectId_ReturnsKanbansForProject() {
        Kanban kanban2 = new Kanban();
        kanban2.setId(2L);
        kanban2.setName("Kanban 2");
        kanban2.setProjectId(10L);

        List<Kanban> projectKanbans = Arrays.asList(testKanban, kanban2);
        when(kanbanRepository.findByProjectId(10L)).thenReturn(projectKanbans);

        List<Kanban> result = kanbanService.getKanbansByProjectId(10L);

        assertEquals(2, result.size());
        assertEquals(10L, result.get(0).getProjectId());
        verify(kanbanRepository, times(1)).findByProjectId(10L);
    }

    @Test
    void getKanbansByProjectId_NoKanbans_ReturnsEmpty() {
        when(kanbanRepository.findByProjectId(999L)).thenReturn(List.of());

        List<Kanban> result = kanbanService.getKanbansByProjectId(999L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getOrCreateKanbanForProject_Existing_ReturnsExisting() {
        when(kanbanRepository.findByProjectId(10L)).thenReturn(Arrays.asList(testKanban));

        Kanban result = kanbanService.getOrCreateKanbanForProject(10L);

        assertEquals(testKanban.getId(), result.getId());
        verify(kanbanRepository, times(1)).findByProjectId(10L);
        verify(kanbanRepository, never()).save(any(Kanban.class));
        verify(kanbanColumnRepository, never()).save(any(KanbanColumn.class));
    }

    @Test
    void getOrCreateKanbanForProject_NotExists_CreatesWithDefaultColumns() {
        Kanban newKanban = new Kanban();
        newKanban.setId(5L);
        newKanban.setName("Kanban Board");
        newKanban.setProjectId(10L);

        when(kanbanRepository.findByProjectId(10L)).thenReturn(List.of());
        when(kanbanRepository.save(any(Kanban.class))).thenReturn(newKanban);
        when(kanbanColumnRepository.save(any(KanbanColumn.class))).thenReturn(testColumn);

        Kanban result = kanbanService.getOrCreateKanbanForProject(10L);

        assertNotNull(result);
        assertEquals("Kanban Board", result.getName());
        assertEquals(10L, result.getProjectId());
        
        verify(kanbanRepository, times(1)).findByProjectId(10L);
        verify(kanbanRepository, times(1)).save(any(Kanban.class));
        verify(kanbanColumnRepository, times(4)).save(any(KanbanColumn.class));
    }

    @Test
    void getOrCreateKanbanForProject_CreatesAllDefaultColumns() {
        Kanban newKanban = new Kanban();
        newKanban.setId(5L);
        newKanban.setName("Kanban Board");
        newKanban.setProjectId(10L);

        when(kanbanRepository.findByProjectId(10L)).thenReturn(List.of());
        when(kanbanRepository.save(any(Kanban.class))).thenReturn(newKanban);
        when(kanbanColumnRepository.save(any(KanbanColumn.class))).thenReturn(testColumn);

        kanbanService.getOrCreateKanbanForProject(10L);

        ArgumentCaptor<KanbanColumn> columnCaptor = ArgumentCaptor.forClass(KanbanColumn.class);
        verify(kanbanColumnRepository, times(4)).save(columnCaptor.capture());
        
        List<KanbanColumn> savedColumns = columnCaptor.getAllValues();
        assertEquals("To Do", savedColumns.get(0).getName());
        assertEquals("In Progress", savedColumns.get(1).getName());
        assertEquals("In Review", savedColumns.get(2).getName());
        assertEquals("Done", savedColumns.get(3).getName());
    }

    @Test
    void getKanbanBoard_Success() {
        List<KanbanColumn> columns = Arrays.asList(testColumn);
        
        when(kanbanRepository.findByProjectId(10L)).thenReturn(Arrays.asList(testKanban));
        when(kanbanColumnRepository.findByKanbanIdOrderByPosition(1L)).thenReturn(columns);

        KanbanBoardResponseDTO result = kanbanService.getKanbanBoard(10L);

        assertNotNull(result);
        assertEquals(1L, result.getKanbanId());
        assertEquals("Test Kanban Board", result.getName());
        assertEquals(10L, result.getProjectId());
        assertEquals(1, result.getColumns().size());
        assertEquals("To Do", result.getColumns().get(0).getName());
    }

    @Test
    void getKanbanBoard_NoColumns_ReturnsEmptyColumnList() {
        Kanban emptyKanban = new Kanban();
        emptyKanban.setId(1L);
        emptyKanban.setName("Empty Board");
        emptyKanban.setProjectId(10L);

        when(kanbanRepository.findByProjectId(10L)).thenReturn(Arrays.asList(emptyKanban));
        when(kanbanColumnRepository.findByKanbanIdOrderByPosition(1L)).thenReturn(List.of());

        KanbanBoardResponseDTO result = kanbanService.getKanbanBoard(10L);

        assertNotNull(result);
        assertTrue(result.getColumns().isEmpty());
    }

    @Test
    void getKanbanBoard_MapsColumnPropertiesCorrectly() {
        KanbanColumn column1 = new KanbanColumn();
        column1.setId(100L);
        column1.setName("Todo");
        column1.setStatus("TODO");
        column1.setPosition(0);
        column1.setColor("#F3F4F6");
        column1.setWipLimit(5);

        List<KanbanColumn> columns = Arrays.asList(column1);
        
        when(kanbanRepository.findByProjectId(10L)).thenReturn(Arrays.asList(testKanban));
        when(kanbanColumnRepository.findByKanbanIdOrderByPosition(1L)).thenReturn(columns);

        KanbanBoardResponseDTO result = kanbanService.getKanbanBoard(10L);

        KanbanBoardResponseDTO.KanbanColumnDTO dto = result.getColumns().get(0);
        assertEquals(100L, dto.getId());
        assertEquals("Todo", dto.getName());
        assertEquals("TODO", dto.getStatus());
        assertEquals(0, dto.getPosition());
        assertEquals("#F3F4F6", dto.getColor());
        assertEquals(5, dto.getWipLimit());
    }
}
