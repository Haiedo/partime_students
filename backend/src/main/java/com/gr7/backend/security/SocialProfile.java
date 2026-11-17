package com.gr7.backend.security;

import com.gr7.backend.entity.SocialProvider;

/**
 * Thông tin lấy được từ Google / Facebook sau khi đã xác minh token.
 * email có thể null (tài khoản Facebook đăng ký bằng số điện thoại).
 */
public record SocialProfile(SocialProvider provider, String providerUserId, String email,
                            boolean emailVerified, String fullName) {}
