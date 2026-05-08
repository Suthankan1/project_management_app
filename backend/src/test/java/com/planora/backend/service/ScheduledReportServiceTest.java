package com.planora.backend.service;

import com.planora.backend.dto.ScheduledReportRequestDTO;
import com.planora.backend.dto.ScheduledReportResponseDTO;
import com.planora.backend.model.ScheduledReport;
import com.planora.backend.repository.ScheduledReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ScheduledReportServiceTest {
    @Mock
    private ScheduledReportRepository repo;
    @InjectMocks
    private ReportScheduledService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateScheduledReport_Success() {
        // TODO: Implement test for creating scheduled report
    }

    @Test
    void testDeleteScheduledReport_Success() {
        // TODO: Implement test for deleting scheduled report
    }
}
