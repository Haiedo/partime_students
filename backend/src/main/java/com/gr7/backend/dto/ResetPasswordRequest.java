package com.gr7.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body của POST /api/auth/reset-password: mã trong email + mật khẩu mới. */
public record ResetPasswordRequest(
        @NotBlank(message = "Thiếu mã đặt lại mật khẩu") String token,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        String newPassword
) {}
