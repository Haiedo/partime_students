package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Body của POST /api/auth/google: ID token lấy từ Google Identity Services. */
public record GoogleLoginRequest(@NotBlank(message = "Thiếu ID token của Google") String idToken) {}
