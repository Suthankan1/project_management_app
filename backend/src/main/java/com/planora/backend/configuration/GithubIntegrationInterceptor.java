package com.planora.backend.configuration;

import com.planora.backend.service.GithubTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class GithubIntegrationInterceptor implements HandlerInterceptor {

    private final GithubTokenService githubTokenService;

    public GithubIntegrationInterceptor(@org.springframework.context.annotation.Lazy GithubTokenService githubTokenService) {
        this.githubTokenService = githubTokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        githubTokenService.validateGithubIntegration();
        return true;
    }
}
