package com.planora.backend.controller;

import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.ReportDownloadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectReportControllerTest {
    @Mock
    private ReportDownloadService reportDownloadService;
    @InjectMocks
    private ReportController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testDownloadProjectReport_Success() {
        // TODO: Implement test for successful report download
    }

    @Test
    void testDownloadProjectReport_Unauthenticated() {
        // TODO: Implement test for unauthenticated access
    }
}
