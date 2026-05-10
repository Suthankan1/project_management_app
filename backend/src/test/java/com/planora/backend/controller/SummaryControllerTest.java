package com.planora.backend.controller;

import com.planora.backend.dto.SummaryPageDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.SummaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SummaryControllerTest {

    @Mock
    private SummaryService summaryService;

    @InjectMocks
    private SummaryController summaryController;

    private UserPrincipal principal;

    @BeforeEach
    public void setup() {
        principal = mock(UserPrincipal.class);
        when(principal.getUserId()).thenReturn(1L);
    }

    @Test
    public void testGetDashboardSummary_Success() {
        // Arrange
        Long projectId = 100L;
        SummaryPageDTO mockSummary = SummaryPageDTO.builder().build();
        when(summaryService.getDashboardSummary(eq(projectId), eq(1L)))
                .thenReturn(mockSummary);

        // Act
        ResponseEntity<SummaryPageDTO> response = summaryController.getDashboardSummary(projectId, principal);

        // Assert
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(mockSummary, response.getBody());
    }
}
