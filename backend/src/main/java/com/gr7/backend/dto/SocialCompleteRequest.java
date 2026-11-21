package com.gr7.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body của POST /api/auth/social/complete (MH-13 – Chọn vai trò). */
public record SocialCompleteRequest(
        @NotBlank(message = "Thiếu signupToken") String signupToken,

        @NotBlank(message = "Vui lòng chọn vai trò")
        @Pattern(regexp = "STUDENT|EMPLOYER", message = "Vai trò chỉ được là STUDENT hoặc EMPLOYER")
        String role,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        /** Chỉ cần khi Facebook không trả email. */
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email
) {}
