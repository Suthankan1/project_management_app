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

import java.time.*;
import java.util.List;
import java.util.Optional;

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
        ScheduledReportRequestDTO dto = new ScheduledReportRequestDTO();
        dto.setProjectId(1L);
        dto.setFormat("PDF");
        dto.setScheduleType("RECURRING");
        dto.setFrequency("DAILY");
        dto.setSendTime("09:00");
        dto.setTimezone("America/New_York");
        dto.setRecipientsTo(List.of("test@example.com"));
        dto.setSubject("Daily Summary");
        dto.setBodyMessage("Check the report.");

        ScheduledReport savedReport = new ScheduledReport();
        savedReport.setId(10L);
        savedReport.setProjectId(1L);
        savedReport.setCreatedByUserId(5L);
        savedReport.setFormat("PDF");
        savedReport.setScheduleType("RECURRING");
        savedReport.setFrequency("DAILY");
        savedReport.setSendTime("09:00");
        savedReport.setTimezone("America/New_York");
        savedReport.setRecipientsTo("test@example.com");
        savedReport.setSubject("Daily Summary");
        savedReport.setBodyMessage("Check the report.");
        savedReport.setStatus("ACTIVE");

        when(repo.save(any(ScheduledReport.class))).thenReturn(savedReport);

        ScheduledReportResponseDTO result = service.create(dto, 5L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("America/New_York", result.getTimezone());
        assertEquals("DAILY", result.getFrequency());
        verify(repo, times(1)).save(any(ScheduledReport.class));
    }

    @Test
    void testDeleteScheduledReport_Success() {
        doNothing().when(repo).deleteById(10L);

        assertDoesNotThrow(() -> service.delete(10L));
        verify(repo, times(1)).deleteById(10L);
    }

    @Test
    void testComputeNextSendAt_UTC_NoDstTransitions() {
        ScheduledReport sr = new ScheduledReport();
        sr.setScheduleType("RECURRING");
        sr.setFrequency("DAILY");
        sr.setSendTime("09:00");
        sr.setTimezone("UTC");

        // Compute next send time from 2026-05-30T10:00:00Z in UTC.
        // It should advance by 1 day and trigger on 2026-05-31 at 09:00:00Z.
        Instant current = Instant.parse("2026-05-30T10:00:00Z");
        Instant next = service.computeNextSendAt(sr, current);

        assertNotNull(next);
        assertEquals("2026-05-31T09:00:00Z", next.toString());
    }

    @Test
    void testComputeNextSendAt_AmericaNewYork_DstSpringForward() {
        ScheduledReport sr = new ScheduledReport();
        sr.setScheduleType("RECURRING");
        sr.setFrequency("DAILY");
        sr.setSendTime("09:00");
        sr.setTimezone("America/New_York"); // DST Spring Forward is on March 8, 2026 at 2:00 AM

        // Start Saturday March 7, 2026 at 09:00 AM local time.
        // Standard Eastern Time (EST) offset is -05:00. So 9:00 EST = 14:00 UTC.
        Instant satMorning = ZonedDateTime.of(2026, 3, 7, 9, 0, 0, 0, ZoneId.of("America/New_York")).toInstant();
        assertEquals("2026-03-07T14:00:00Z", satMorning.toString());

        // Compute next daily run. It should trigger on Sunday March 8, 2026 at 09:00 AM local time.
        // Because of the DST spring forward transition (+1 hour), the offset becomes -04:00 (EDT).
        // Therefore, 9:00 EDT = 13:00 UTC.
        Instant nextOccurrence = service.computeNextSendAt(sr, satMorning);

        assertNotNull(nextOccurrence);
        assertEquals("2026-03-08T13:00:00Z", nextOccurrence.toString());

        // Verify local time remains strictly 09:00:00 America/New_York
        ZonedDateTime localTime = ZonedDateTime.ofInstant(nextOccurrence, ZoneId.of("America/New_York"));
        assertEquals(9, localTime.getHour());
        assertEquals(0, localTime.getMinute());
        assertEquals(DayOfWeek.SUNDAY, localTime.getDayOfWeek());
    }

    @Test
    void testComputeNextSendAt_AmericaNewYork_DstFallBack() {
        ScheduledReport sr = new ScheduledReport();
        sr.setScheduleType("RECURRING");
        sr.setFrequency("DAILY");
        sr.setSendTime("09:00");
        sr.setTimezone("America/New_York"); // DST Fall Back is on November 1, 2026

        // Start Saturday October 31, 2026 at 09:00 AM local time.
        // Daylight saving time (EDT) offset is -04:00. So 9:00 EDT = 13:00 UTC.
        Instant satMorning = ZonedDateTime.of(2026, 10, 31, 9, 0, 0, 0, ZoneId.of("America/New_York")).toInstant();
        assertEquals("2026-10-31T13:00:00Z", satMorning.toString());

        // Compute next daily run. It should trigger on Sunday November 1, 2026 at 09:00 AM local time.
        // Because of the DST fall back transition (-1 hour), the offset becomes -05:00 (EST).
        // Therefore, 9:00 EST = 14:00 UTC.
        Instant nextOccurrence = service.computeNextSendAt(sr, satMorning);

        assertNotNull(nextOccurrence);
        assertEquals("2026-11-01T14:00:00Z", nextOccurrence.toString());

        // Verify local time remains strictly 09:00:00 America/New_York
        ZonedDateTime localTime = ZonedDateTime.ofInstant(nextOccurrence, ZoneId.of("America/New_York"));
        assertEquals(9, localTime.getHour());
        assertEquals(0, localTime.getMinute());
        assertEquals(DayOfWeek.SUNDAY, localTime.getDayOfWeek());
    }

    @Test
    void testComputeNextSendAt_CustomInterval() {
        ScheduledReport sr = new ScheduledReport();
        sr.setScheduleType("RECURRING");
        sr.setFrequency("CUSTOM");
        sr.setCustomIntervalDays(3);
        sr.setSendTime("17:00");
        sr.setTimezone("UTC");

        // Start May 30, 2026. Custom interval is 3 days.
        // It should trigger on June 2, 2026 at 17:00 UTC.
        Instant from = ZonedDateTime.of(2026, 5, 30, 17, 0, 0, 0, ZoneId.of("UTC")).toInstant();
        Instant next = service.computeNextSendAt(sr, from);

        assertNotNull(next);
        assertEquals("2026-06-02T17:00:00Z", next.toString());
    }
}
