package com.planora.backend.configuration;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.ServletInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.ByteArrayInputStream;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.IpAddressMatcher;

/**
 * In-memory, per-IP rate limiter for sensitive auth endpoints.
 * Allows at most 5 requests per minute per IP on the configured paths.
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final int MAX_INVITATIONS_PER_HOUR = 10;
    private static final int MAX_RESETS_PER_15_MIN = 5;

    private static final Pattern PROJECT_INVITE_PATH = Pattern.compile("^/api/projects/(\\d+)/invitations$");

    private static final List<String> RATE_LIMITED_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/forgot",
            "/api/auth/resend",
            "/api/auth/resend-otp",
            "/api/auth/reset"
    );

    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .expireAfterAccess(2, TimeUnit.MINUTES)
            .maximumSize(50_000)
            .recordStats()
            .build();

    private final java.util.List<IpAddressMatcher> trustedProxyMatchers;

    public RateLimitingFilter() {
        this("127.0.0.1,::1");
    }

    public RateLimitingFilter(@Value("${app.security.trusted-proxies:127.0.0.1,::1}") String trustedProxiesProperty) {
        log.warn("Eviction count at startup: {}", buckets.stats().evictionCount());
        String properties = (trustedProxiesProperty == null || trustedProxiesProperty.isBlank())
                ? "127.0.0.1,::1"
                : trustedProxiesProperty;
        this.trustedProxyMatchers = java.util.Arrays.stream(properties.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(IpAddressMatcher::new)
                .toList();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if (isProjectInviteRequest(request)) {
            return false;
        }
        return RATE_LIMITED_PATHS.stream().noneMatch(path::equals);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String key;
        Bucket bucket;
        HttpServletRequest requestToProcess = request;

        if (isResetPasswordRequest(request)) {
            CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(request);
            requestToProcess = wrappedRequest;
            String email = "unknown";
            try {
                byte[] body = wrappedRequest.getCachedBody();
                if (body != null && body.length > 0) {
                    Map<String, Object> map = new com.fasterxml.jackson.databind.ObjectMapper().readValue(body, Map.class);
                    if (map != null && map.get("email") != null) {
                        email = map.get("email").toString().trim().toLowerCase();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse email from reset password request body", e);
            }
            key = "reset:" + resolveClientIp(wrappedRequest) + ":" + email;
            bucket = buckets.get(key, k -> newResetBucket());
        } else if (isProjectInviteRequest(request)) {
            Matcher matcher = PROJECT_INVITE_PATH.matcher(request.getServletPath());
            String projectId = matcher.find() ? matcher.group(1) : "unknown";
            key = "invite-project:" + projectId + ":" + resolveClientIp(request);
            bucket = buckets.get(key, k -> newInvitationBucket());
        } else {
            key = resolveClientIp(request) + ":" + request.getServletPath();
            bucket = buckets.get(key, k -> newBucket());
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(requestToProcess, response);
        } else {
            log.warn("Rate limit exceeded for key={}", key);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            String message = isResetPasswordRequest(request)
                ? "Too many password reset attempts. Please try again in 15 minutes."
                : (isProjectInviteRequest(request)
                    ? "Too many invitations sent, try again in 1 hour"
                    : "Too many requests. Please try again later.");
            com.planora.backend.dto.ApiErrorResponse errorResponse = new com.planora.backend.dto.ApiErrorResponse(
                java.time.LocalDateTime.now().toString(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "RATE_LIMIT",
                message,
                request.getRequestURI(),
                null
            );
            response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(errorResponse));
        }
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_REQUESTS_PER_MINUTE)
                .refillIntervally(MAX_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket newInvitationBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_INVITATIONS_PER_HOUR)
                .refillIntervally(MAX_INVITATIONS_PER_HOUR, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket newResetBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_RESETS_PER_15_MIN)
                .refillIntervally(MAX_RESETS_PER_15_MIN, Duration.ofMinutes(15))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private boolean isProjectInviteRequest(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        return PROJECT_INVITE_PATH.matcher(request.getServletPath()).matches();
    }

    private boolean isResetPasswordRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod()) && "/api/auth/reset".equals(request.getServletPath());
    }

    private HttpServletRequest unwrapRequest(HttpServletRequest request) {
        jakarta.servlet.ServletRequest current = request;
        while (current instanceof HttpServletRequestWrapper) {
            current = ((HttpServletRequestWrapper) current).getRequest();
        }
        return (HttpServletRequest) current;
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        for (IpAddressMatcher matcher : trustedProxyMatchers) {
            if (matcher.matches(ip)) {
                return true;
            }
        }
        return false;
    }

    private String resolveClientIp(HttpServletRequest request) {
        HttpServletRequest rawRequest = unwrapRequest(request);
        String immediatePeer = rawRequest.getRemoteAddr();

        if (isTrustedProxy(immediatePeer)) {
            String xForwardedFor = rawRequest.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                String[] parts = xForwardedFor.split(",");
                for (int i = parts.length - 1; i >= 0; i--) {
                    String ip = parts[i].trim();
                    if (!ip.isEmpty() && !isTrustedProxy(ip)) {
                        return ip;
                    }
                }
                if (parts.length > 0) {
                    String leftmost = parts[0].trim();
                    if (!leftmost.isEmpty()) {
                        return leftmost;
                    }
                }
            }
            return request.getRemoteAddr();
        }

        return immediatePeer;
    }

    private static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            this.cachedBody = request.getInputStream().readAllBytes();
        }

        public byte[] getCachedBody() {
            return cachedBody;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return new CachedBodyServletInputStream(this.cachedBody);
        }

        @Override
        public BufferedReader getReader() throws IOException {
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(this.cachedBody);
            return new BufferedReader(new InputStreamReader(byteArrayInputStream));
        }
    }

    private static class CachedBodyServletInputStream extends ServletInputStream {
        private final ByteArrayInputStream cachedBodyInputStream;

        public CachedBodyServletInputStream(byte[] cachedBody) {
            this.cachedBodyInputStream = new ByteArrayInputStream(cachedBody);
        }

        @Override
        public boolean isFinished() {
            return cachedBodyInputStream.available() == 0;
        }

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setReadListener(jakarta.servlet.ReadListener readListener) {
            throw new UnsupportedOperationException();
        }

        @Override
        public int read() throws IOException {
            return cachedBodyInputStream.read();
        }
    }
}
