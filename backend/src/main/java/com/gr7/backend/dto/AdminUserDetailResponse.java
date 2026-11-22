package com.gr7.backend.dto;

import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;

/** Chi tiết tài khoản cho Quản trị viên: thông tin chung + hồ sơ SV/NTD + danh sách đơn/tin liên quan. */
public record AdminUserDetailResponse(
        Long id, String email, String fullName, String phone, String role, String status,
        LocalDateTime createdAt, LocalDateTime updatedAt,
        String school, String major, String skills, String bio, String cvUrl,
        List<MyApplicationResponse> applications,
        String companyName, String companyDescription, String contactEmail, String contactPhone, String address,
        List<AdminJobResponse> jobs
) {
    public static AdminUserDetailResponse from(User u, StudentProfile sp, List<MyApplicationResponse> apps,
                                               EmployerProfile ep, List<AdminJobResponse> empJobs) {
        return new AdminUserDetailResponse(
                u.getId(), u.getEmail(), u.getFullName(), u.getPhone(), u.getRole().name(), u.getStatus().name(),
                u.getCreatedAt(), u.getUpdatedAt(),
                sp != null ? sp.getSchool() : null,
                sp != null ? sp.getMajor() : null,
                sp != null ? sp.getSkills() : null,
                sp != null ? sp.getBio() : null,
                sp != null ? sp.getCvUrl() : null,
                apps,
                ep != null ? ep.getCompanyName() : null,
                ep != null ? ep.getDescription() : null,
                ep != null ? ep.getContactEmail() : null,
                ep != null ? ep.getContactPhone() : null,
                ep != null ? ep.getAddress() : null,
                empJobs
        );
    }
}