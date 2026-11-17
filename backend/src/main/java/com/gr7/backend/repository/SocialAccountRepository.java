package com.gr7.backend.repository;

import com.gr7.backend.entity.SocialAccount;
import com.gr7.backend.entity.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    Optional<SocialAccount> findByProviderAndProviderUserId(SocialProvider provider, String providerUserId);
    boolean existsByUserIdAndProvider(Long userId, SocialProvider provider);
}
