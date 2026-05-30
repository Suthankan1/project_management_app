package com.planora.backend.service;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.planora.backend.model.User;
import com.planora.backend.model.UserPushToken;
import com.planora.backend.repository.UserPushTokenRepository;

@Service
public class UserPushTokenService {

    @Autowired
    private UserService userService;

    @Autowired
    private UserPushTokenRepository userPushTokenRepository;

    @Transactional
    public void registerPushToken(String email, String pushToken, String platform) {
        if (pushToken == null || pushToken.isBlank()) {
            throw new IllegalArgumentException("Push token is required");
        }
        if (platform == null || platform.isBlank()) {
            throw new IllegalArgumentException("Platform is required");
        }

        String normalizedToken = pushToken.trim();
        String normalizedPlatform = platform.trim().toLowerCase(Locale.ROOT);
        if (!normalizedPlatform.equals("ios") && !normalizedPlatform.equals("android")) {
            throw new IllegalArgumentException("Platform must be ios or android");
        }

        User user = userService.getUserByEmail(email);
        UserPushToken token = userPushTokenRepository
                .findByUserUserIdAndToken(user.getUserId(), normalizedToken)
                .orElseGet(UserPushToken::new);

        token.setUser(user);
        token.setToken(normalizedToken);
        token.setPlatform(normalizedPlatform);
        userPushTokenRepository.save(token);
    }
}