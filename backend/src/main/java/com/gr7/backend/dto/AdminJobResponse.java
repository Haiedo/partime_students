package com.gr7.backend.dto;

import com.gr7.backend.entity.JobPost;

import java.time.LocalDateTime;

/** Một dòng trong tab Tin đăng của trang Quản trị (PB-16). */
public record AdminJobResponse(Long id, String title, String companyName, String category, String location,
                               String status, boolean hidden, LocalDateTime createdAt) {

    public static AdminJobResponse from(JobPost j) {
        return new AdminJobResponse(j.getId(), j.getTitle(), j.getEmployer().getCompanyName(), j.getCategory(),
                j.getLocation(), j.getStatus().name(), j.isHidden(), j.getCreatedAt());
    }
}
