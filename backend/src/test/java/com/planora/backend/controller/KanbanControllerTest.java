package com.planora.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.KanbanBoardResponseDTO;
import com.planora.backend.dto.KanbanRequestDTO;
import com.planora.backend.model.Kanban;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.KanbanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(KanbanController.class)
class KanbanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KanbanService kanbanService;

    @MockBean
    private JWTService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private Kanban testKanban;
    private KanbanRequestDTO kanbanRequestDTO;
    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        testKanban = new Kanban();
        testKanban.setId(1L);
        testKanban.setName("Test Kanban Board");
        testKanban.setProjectId(10L);

        kanbanRequestDTO = new KanbanRequestDTO();
        kanbanRequestDTO.setName("Test Kanban Board");
        kanbanRequestDTO.setProjectId(10L);

        // Create a test user for authentication
        testUser = User.builder()
                .username("testuser")
                .password("ValidPassword123!")
                .authorities("ROLE_USER")
                .build();
    }

    @Test
    void createKanban_Returns200WithCreatedKanban() throws Exception {
        when(kanbanService.createKanban(any(KanbanRequestDTO.class))).thenReturn(testKanban);

        mockMvc.perform(post("/api/kanbans")
                .with(user(testUser))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(kanbanRequestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Kanban Board"))
                .andExpect(jsonPath("$.projectId").value(10));

        verify(kanbanService, times(1)).createKanban(any(KanbanRequestDTO.class));
    }

    @Test
    void getAllKanbans_Returns200WithAllKanbans() throws Exception {
        Kanban kanban2 = new Kanban();
        kanban2.setId(2L);
        kanban2.setName("Kanban 2");
        kanban2.setProjectId(20L);

        List<Kanban> kanbans = Arrays.asList(testKanban, kanban2);
        when(kanbanService.getAllKanbans()).thenReturn(kanbans);

        mockMvc.perform(get("/api/kanbans")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Test Kanban Board"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("Kanban 2"));

        verify(kanbanService, times(1)).getAllKanbans();
    }

    @Test
    void getAllKanbans_EmptyList_Returns200() throws Exception {
        when(kanbanService.getAllKanbans()).thenReturn(List.of());

        mockMvc.perform(get("/api/kanbans")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getKanbanById_Exists_Returns200() throws Exception {
        when(kanbanService.getKanbanById(1L)).thenReturn(Optional.of(testKanban));

        mockMvc.perform(get("/api/kanbans/1")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Kanban Board"));

        verify(kanbanService, times(1)).getKanbanById(1L);
    }

    @Test
    void getKanbanById_NotExists_Returns404() throws Exception {
        when(kanbanService.getKanbanById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/kanbans/999")
                .with(user(testUser)))
                .andExpect(status().isNotFound());

        verify(kanbanService, times(1)).getKanbanById(999L);
    }

    @Test
    void updateKanban_Returns200WithUpdatedKanban() throws Exception {
        Kanban updatedKanban = new Kanban();
        updatedKanban.setId(1L);
        updatedKanban.setName("Updated Kanban");
        updatedKanban.setProjectId(10L);

        KanbanRequestDTO updateDTO = new KanbanRequestDTO();
        updateDTO.setName("Updated Kanban");
        updateDTO.setProjectId(10L);

        when(kanbanService.updateKanban(eq(1L), any(KanbanRequestDTO.class))).thenReturn(updatedKanban);

        mockMvc.perform(put("/api/kanbans/1")
                .with(user(testUser))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Kanban"));

        verify(kanbanService, times(1)).updateKanban(eq(1L), any(KanbanRequestDTO.class));
    }

    @Test
    void deleteKanban_Returns204NoContent() throws Exception {
        doNothing().when(kanbanService).deleteKanban(1L);

        mockMvc.perform(delete("/api/kanbans/1")
                .with(user(testUser))
                .with(csrf()))
                .andExpect(status().isNoContent());

        verify(kanbanService, times(1)).deleteKanban(1L);
    }

    @Test
    void getKanbansByProjectId_Returns200WithKanbans() throws Exception {
        List<Kanban> projectKanbans = Arrays.asList(testKanban);
        when(kanbanService.getKanbansByProjectId(10L)).thenReturn(projectKanbans);

        mockMvc.perform(get("/api/kanbans/project/10")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].projectId").value(10));

        verify(kanbanService, times(1)).getKanbansByProjectId(10L);
    }

    @Test
    void getKanbansByProjectId_NoKanbans_Returns200WithEmpty() throws Exception {
        when(kanbanService.getKanbansByProjectId(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/kanbans/project/999")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getKanbanBoard_Returns200WithBoardDTO() throws Exception {
        KanbanBoardResponseDTO boardDTO = new KanbanBoardResponseDTO();
        boardDTO.setKanbanId(1L);
        boardDTO.setName("Test Kanban Board");
        boardDTO.setProjectId(10L);
        boardDTO.setColumns(List.of());

        when(kanbanService.getKanbanBoard(10L)).thenReturn(boardDTO);

        mockMvc.perform(get("/api/kanbans/project/10/board")
                .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kanbanId").value(1))
                .andExpect(jsonPath("$.name").value("Test Kanban Board"))
                .andExpect(jsonPath("$.projectId").value(10));

        verify(kanbanService, times(1)).getKanbanBoard(10L);
    }

    @Test
    void autoCreateKanban_Returns200WithCreatedBoard() throws Exception {
        when(kanbanService.getOrCreateKanbanForProject(10L)).thenReturn(testKanban);

        mockMvc.perform(post("/api/kanbans/project/10/auto-create")
                .with(user(testUser))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Kanban Board"));

        verify(kanbanService, times(1)).getOrCreateKanbanForProject(10L);
    }

    @Test
    void createKanban_InvalidPayload_Returns400() throws Exception {
        mockMvc.perform(post("/api/kanbans")
                .with(user(testUser))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json}"))
                .andExpect(status().isBadRequest());
    }
}
