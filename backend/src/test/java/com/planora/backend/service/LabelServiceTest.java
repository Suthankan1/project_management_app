package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.planora.backend.model.Label;
import com.planora.backend.model.Project;
import com.planora.backend.repository.LabelRepository;

@ExtendWith(MockitoExtension.class)
class LabelServiceTest {

    @Mock
    private LabelRepository labelRepository;

    @InjectMocks
    private LabelService service;

    @Test
    void findOrCreate_reusesExistingProjectLabelRegardlessOfColor() {
        Project project = new Project();
        project.setId(10L);
        Label existing = new Label("bug", "#000000", project);
        when(labelRepository.findFirstByProjectIdAndNameIgnoreCase(10L, "bug"))
                .thenReturn(Optional.of(existing));

        Label result = service.findOrCreate("bug", "#d73a4a", project);

        assertEquals(existing, result);
        verify(labelRepository, never()).save(org.mockito.ArgumentMatchers.any(Label.class));
    }
}
