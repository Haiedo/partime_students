package com.gr7.backend.dto;

import com.gr7.backend.entity.User;

import java.time.LocalDateTime;

/** Một dòng trong tab Người dùng của trang Quản trị (PB-15). */
public record AdminUserResponse(Long id, String email, String fullName, String role, String status, LocalDateTime createdAt) {

    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name(),
                u.getStatus().name(), u.getCreatedAt());
    }
}
