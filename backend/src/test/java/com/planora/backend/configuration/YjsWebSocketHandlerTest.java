package com.planora.backend.configuration;

import com.planora.backend.model.ProjectPage;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectPageRepository;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ProjectMembershipService;
import com.planora.backend.service.UserCacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class YjsWebSocketHandlerTest {

    @Mock
    private JWTService jwtService;

    @Mock
    private UserCacheService userCacheService;

    @Mock
    private ProjectMembershipService projectMembershipService;

    @Mock
    private ProjectPageRepository projectPageRepository;

    @Mock
    private WebSocketSession session;

    private YjsWebSocketHandler newHandler() {
        return new YjsWebSocketHandler(jwtService, userCacheService, projectMembershipService, projectPageRepository);
    }

    @Test
    void closesConnectionWhenAuthorizationIsMissing() throws Exception {
        when(session.getUri()).thenReturn(URI.create("ws://localhost/yjs/page-42"));
        when(session.getHandshakeHeaders()).thenReturn(new HttpHeaders());

        newHandler().afterConnectionEstablished(session);

        ArgumentCaptor<CloseStatus> closeStatusCaptor = ArgumentCaptor.forClass(CloseStatus.class);
        verify(session).close(closeStatusCaptor.capture());
        assertEquals(4401, closeStatusCaptor.getValue().getCode());
    }

    @Test
    void closesConnectionWhenUserHasNoProjectAccess() throws Exception {
        when(session.getUri()).thenReturn(URI.create("ws://localhost/yjs/page-42"));

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer valid-token");
        when(session.getHandshakeHeaders()).thenReturn(headers);

        User user = new User();
        user.setUserId(9L);

        ProjectPage page = new ProjectPage();
        page.setId(42L);
        page.setProjectId(123L);

        when(jwtService.extractUserName("valid-token")).thenReturn("alice@example.com");
        when(userCacheService.resolveUserByEmailOrUsername("alice@example.com")).thenReturn(user);
        when(projectPageRepository.findById(42L)).thenReturn(Optional.of(page));
        when(projectMembershipService.isProjectMember(123L, 9L)).thenReturn(false);

        newHandler().afterConnectionEstablished(session);

        ArgumentCaptor<CloseStatus> closeStatusCaptor = ArgumentCaptor.forClass(CloseStatus.class);
        verify(session).close(closeStatusCaptor.capture());
        assertEquals(4403, closeStatusCaptor.getValue().getCode());
    }

    @Test
    void allowsConnectionWhenUserCanAccessPageProject() throws Exception {
        when(session.getUri()).thenReturn(URI.create("ws://localhost/yjs/42"));

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer valid-token");
        when(session.getHandshakeHeaders()).thenReturn(headers);

        User user = new User();
        user.setUserId(9L);

        ProjectPage page = new ProjectPage();
        page.setId(42L);
        page.setProjectId(123L);

        when(jwtService.extractUserName("valid-token")).thenReturn("alice@example.com");
        when(userCacheService.resolveUserByEmailOrUsername("alice@example.com")).thenReturn(user);
        when(projectPageRepository.findById(42L)).thenReturn(Optional.of(page));
        when(projectMembershipService.isProjectMember(123L, 9L)).thenReturn(true);

        newHandler().afterConnectionEstablished(session);

        verify(session, never()).close(any(CloseStatus.class));
    }
}
