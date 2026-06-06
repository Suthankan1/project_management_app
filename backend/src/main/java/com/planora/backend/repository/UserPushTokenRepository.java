package com.planora.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.planora.backend.model.UserPushToken;

@Repository
public interface UserPushTokenRepository extends JpaRepository<UserPushToken, Long> {

    List<UserPushToken> findByUserUserId(Long userId);

    Optional<UserPushToken> findByUserUserIdAndToken(Long userId, String token);
}