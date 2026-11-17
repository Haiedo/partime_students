package com.gr7.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Body của POST /api/auth/forgot-password. */
public record ForgotPasswordRequest(
        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không đúng định dạng")
        String email
) {}
