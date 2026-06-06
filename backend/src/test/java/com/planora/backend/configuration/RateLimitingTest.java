package com.planora.backend.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingTest {

    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter("127.0.0.1,::1");
    }

    @Test
    void shouldNotFilter_returnsTrueForNonRateLimitedPath() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/tasks");
        request.setServletPath("/api/tasks");
        assertTrue(rateLimitingFilter.shouldNotFilter(request));
    }

    @Test
    void shouldNotFilter_returnsFalseForLoginPath() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        assertFalse(rateLimitingFilter.shouldNotFilter(request));
    }

    @Test
    void shouldNotFilter_returnsFalseForProjectInvitePath() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/projects/10/invitations");
        request.setServletPath("/api/projects/10/invitations");
        assertFalse(rateLimitingFilter.shouldNotFilter(request));
    }

    @Test
    void doFilterInternal_allowsFirstFiveRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        FilterChain chain = mock(FilterChain.class);

        // Should allow first 5 requests
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitingFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus(), "Request " + (i + 1) + " should be allowed");
        }
        verify(chain, times(5)).doFilter(any(), any());
    }

    @Test
    void doFilterInternal_blocks6thRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/forgot");
        request.setServletPath("/api/auth/forgot");
        request.setRemoteAddr("10.0.0.1");
        FilterChain chain = mock(FilterChain.class);

        // Drain the bucket
        for (int i = 0; i < 5; i++) {
            rateLimitingFilter.doFilterInternal(request, new MockHttpServletResponse(), chain);
        }

        // 6th request should be rate-limited
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        rateLimitingFilter.doFilterInternal(request, blocked, chain);
        assertEquals(429, blocked.getStatus());
    }
    @Test
    void doFilterInternal_blocks6thResetRequestByIpAndEmail() throws Exception {
        String jsonBody = "{\"email\":\"test-rate-limit@example.com\",\"token\":\"123456\",\"newPassword\":\"NewSecure@1\"}";
        FilterChain chain = mock(FilterChain.class);

        // Perform 5 allowed requests
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/reset");
            request.setServletPath("/api/auth/reset");
            request.setRemoteAddr("127.0.0.1");
            request.setContent(jsonBody.getBytes());
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitingFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        // The 6th request should be rate-limited (429)
        MockHttpServletRequest request6 = new MockHttpServletRequest("POST", "/api/auth/reset");
        request6.setServletPath("/api/auth/reset");
        request6.setRemoteAddr("127.0.0.1");
        request6.setContent(jsonBody.getBytes());
        MockHttpServletResponse response6 = new MockHttpServletResponse();
        rateLimitingFilter.doFilterInternal(request6, response6, chain);
        assertEquals(429, response6.getStatus());
        assertTrue(response6.getContentAsString().contains("Too many password reset attempts"));
    }

    @Test
    void resolveClientIp_withUntrustedPeer_ignoresForgedXForwardedFor() throws Exception {
        // Trusted proxy is 192.168.1.1, client peer is 203.0.113.5 (untrusted)
        RateLimitingFilter filter = new RateLimitingFilter("192.168.1.1");
        
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        request.setRemoteAddr("203.0.113.5");
        request.addHeader("X-Forwarded-For", "198.51.100.10"); // Forged XFF
        
        // Drain the bucket (5 allowed)
        FilterChain chain = mock(FilterChain.class);
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }
        
        // 6th request with a DIFFERENT forged X-Forwarded-For should STILL be rate limited because the key is the peer IP (203.0.113.5)
        MockHttpServletRequest request6 = new MockHttpServletRequest("POST", "/api/auth/login");
        request6.setServletPath("/api/auth/login");
        request6.setRemoteAddr("203.0.113.5");
        request6.addHeader("X-Forwarded-For", "203.0.113.88"); // Different forged XFF
        
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilterInternal(request6, blocked, chain);
        assertEquals(429, blocked.getStatus());
    }

    @Test
    void resolveClientIp_withTrustedPeer_trustsXForwardedForLastUntrustedHop() throws Exception {
        // Trusted proxy is 192.168.1.1, client peer is 192.168.1.1 (trusted)
        RateLimitingFilter filter = new RateLimitingFilter("192.168.1.1");
        
        FilterChain chain = mock(FilterChain.class);
        
        // Send 5 requests, each with a different client IP in X-Forwarded-For
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setServletPath("/api/auth/login");
            request.setRemoteAddr("192.168.1.1"); // Trusted peer
            request.addHeader("X-Forwarded-For", "198.51.100." + i); // Distinct client IPs
            
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus(), "Client " + i + " should not be rate-limited");
        }
        
        // A 6th request from a 6th client IP should still be allowed, because the keys are distinct!
        MockHttpServletRequest request6 = new MockHttpServletRequest("POST", "/api/auth/login");
        request6.setServletPath("/api/auth/login");
        request6.setRemoteAddr("192.168.1.1");
        request6.addHeader("X-Forwarded-For", "198.51.100.6");
        
        MockHttpServletResponse response6 = new MockHttpServletResponse();
        filter.doFilterInternal(request6, response6, chain);
        assertEquals(200, response6.getStatus());
    }

    @Test
    void resolveClientIp_withMultipleProxies_takesLastUntrustedHop() throws Exception {
        // Trusted proxies are 192.168.1.1 and 10.0.0.0/8
        RateLimitingFilter filter = new RateLimitingFilter("192.168.1.1, 10.0.0.0/8");
        
        // Immediate peer is 192.168.1.1 (trusted)
        // X-Forwarded-For is "203.0.113.195, 10.0.0.5" (10.0.0.5 is trusted proxy, 203.0.113.195 is client/untrusted)
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        request.setRemoteAddr("192.168.1.1");
        request.addHeader("X-Forwarded-For", "203.0.113.195, 10.0.0.5");
        
        // Drain the bucket (5 allowed)
        FilterChain chain = mock(FilterChain.class);
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }
        
        // 6th request with the same client IP should be blocked
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilterInternal(request, blocked, chain);
        assertEquals(429, blocked.getStatus());
        
        // 6th request with a different client IP (e.g. 203.0.113.99) should NOT be blocked
        MockHttpServletRequest requestDifferent = new MockHttpServletRequest("POST", "/api/auth/login");
        requestDifferent.setServletPath("/api/auth/login");
        requestDifferent.setRemoteAddr("192.168.1.1");
        requestDifferent.addHeader("X-Forwarded-For", "203.0.113.99, 10.0.0.5");
        MockHttpServletResponse allowed = new MockHttpServletResponse();
        filter.doFilterInternal(requestDifferent, allowed, chain);
        assertEquals(200, allowed.getStatus());
    }
}
