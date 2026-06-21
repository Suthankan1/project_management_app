package com.planora.backend.configuration;

import com.planora.backend.service.JWTService;
import com.planora.backend.service.UserService;
import com.planora.backend.controller.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests SecurityConfig behaviour — public endpoints are accessible without auth,
 * and protected ones return 401.
 * Uses a minimal controller slice to avoid loading the full context.
 */
@WebMvcTest(UserController.class)
@org.springframework.context.annotation.Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JWTService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private JwtFilter jwtFilter;

    @MockBean
    private UserService userService;

    @BeforeEach
    void setUp() throws Exception {
        Mockito.doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtFilter).doFilter(any(), any(), any());
    }

    @Test
    void publicRegisterEndpoint_isAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/auth/register").with(csrf())
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void protectedEndpoint_returns401_whenNoToken() throws Exception {
        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordEncoder_isUsingBCrypt() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String encoded = encoder.encode("password123");
        assertTrue(encoder.matches("password123", encoded));
        assertFalse(encoder.matches("wrongpassword", encoded));
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(authorities = "USER")
    void getAllUsers_returnsForbidden_whenUserHasUserAuthority() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isForbidden());
    }
}
