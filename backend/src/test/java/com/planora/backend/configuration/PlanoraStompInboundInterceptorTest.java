package com.planora.backend.configuration;

import com.planora.backend.model.User;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ProjectMembershipService;
import com.planora.backend.service.UserCacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanoraStompInboundInterceptorTest {

    @Mock
    private JWTService jwtService;

    @Mock
    private UserCacheService userCacheService;

    @Mock
    private ProjectMembershipService projectMembershipService;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private PlanoraStompInboundInterceptor interceptor;

    private Message<byte[]> buildMutableMessage(StompHeaderAccessor accessor) {
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void connectRejectsMissingAuthorizationHeader() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = buildMutableMessage(accessor);

        MessagingException ex = assertThrows(MessagingException.class, () -> interceptor.preSend(message, messageChannel));
        assertNotNull(ex.getMessage());
    }

    @Test
    void connectSetsPrincipalWhenTokenIsValid() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid-token");

        User user = new User();
        user.setUserId(10L);
        user.setUsername("Alice");

        when(jwtService.extractUserName("valid-token")).thenReturn("alice@example.com");
        when(userCacheService.resolveUserByEmailOrUsername("alice@example.com")).thenReturn(user);

        Message<byte[]> message = buildMutableMessage(accessor);
        Message<?> result = interceptor.preSend(message, messageChannel);
        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor);

        var principal = resultAccessor.getUser();
        assertNotNull(principal);
        assertEquals("alice", principal.getName());
    }

    @Test
    void subscribeRejectsProjectTopicWhenUserIsNotMember() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/project/77/tasks");
        accessor.setUser(new StompPrincipal("alice"));

        User user = new User();
        user.setUserId(23L);

        when(userCacheService.resolveUserByEmailOrUsername("alice")).thenReturn(user);
        when(projectMembershipService.isProjectMember(77L, 23L)).thenReturn(false);

        Message<byte[]> message = buildMutableMessage(accessor);

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
        assertNotNull(ex.getMessage());
    }

    @Test
    void subscribeAllowsProjectTopicWhenUserIsMember() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/projects/88/github/issues");
        accessor.setUser(new StompPrincipal("alice"));

        User user = new User();
        user.setUserId(55L);

        when(userCacheService.resolveUserByEmailOrUsername("alice")).thenReturn(user);
        when(projectMembershipService.isProjectMember(88L, 55L)).thenReturn(true);

        Message<byte[]> message = buildMutableMessage(accessor);

        assertDoesNotThrow(() -> interceptor.preSend(message, messageChannel));
    }
}
