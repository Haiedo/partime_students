package com.gr7.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Bảng social_accounts – liên kết tài khoản Google / Facebook với một người dùng (FR-20, FR-21).
 * UNIQUE(provider, provider_user_id): một tài khoản Google chỉ gắn với một người dùng.
 */
@Entity
@Table(name = "social_accounts",
       uniqueConstraints = @UniqueConstraint(name = "uq_social_provider_user", columnNames = {"provider", "provider_user_id"}))
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SocialProvider provider;

    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId;

    @Column(length = 255)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    public SocialAccount() {}

    public SocialAccount(User user, SocialProvider provider, String providerUserId, String email) {
        this.user = user;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.email = email;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public SocialProvider getProvider() { return provider; }
    public String getProviderUserId() { return providerUserId; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
