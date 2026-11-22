package com.gr7.backend.dto;

import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Chi tiết tin tuyển dụng cho Quản trị viên: đủ thông tin kiểm duyệt và liên kết tới tài khoản NTD. */
public record AdminJobDetailResponse(
        Long id, String title, String description, String category, String location,
        BigDecimal salaryMin, BigDecimal salaryMax, SalaryUnit salaryUnit, String workTime,
        Integer slots, String status, boolean hidden, String rejectReason,
        LocalDateTime createdAt, LocalDateTime updatedAt,
        long applicationCount,
        Long employerUserId, String employerFullName, String employerEmail, String employerStatus,
        String companyName, String companyAddress, String companyDescription,
        String contactEmail, String contactPhone
) {
    public static AdminJobDetailResponse from(JobPost j, long applicationCount) {
        EmployerProfile e = j.getEmployer();
        User u = e.getUser();
        return new AdminJobDetailResponse(
                j.getId(), j.getTitle(), j.getDescription(), j.getCategory(), j.getLocation(),
                j.getSalaryMin(), j.getSalaryMax(), j.getSalaryUnit(), j.getWorkTime(),
                j.getSlots(), j.getStatus().name(), j.isHidden(), j.getRejectReason(),
                j.getCreatedAt(), j.getUpdatedAt(),
                applicationCount,
                u.getId(), u.getFullName(), u.getEmail(), u.getStatus().name(),
                e.getCompanyName(), e.getAddress(), e.getDescription(),
                e.getContactEmail(), e.getContactPhone()
        );
    }
}