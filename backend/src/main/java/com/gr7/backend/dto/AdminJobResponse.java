package com.gr7.backend.dto;

import com.gr7.backend.entity.JobPost;
import java.time.LocalDateTime;

public record AdminJobResponse(Long id, String title, String companyName, String category, String location,
                               String status, boolean hidden, String rejectReason, LocalDateTime createdAt) {

    public static AdminJobResponse from(JobPost j) {
        return new AdminJobResponse(j.getId(), j.getTitle(), j.getEmployer().getCompanyName(), j.getCategory(),
                j.getLocation(), j.getStatus().name(), j.isHidden(), j.getRejectReason(), j.getCreatedAt());
    }
}