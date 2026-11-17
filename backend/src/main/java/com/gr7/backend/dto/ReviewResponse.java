package com.gr7.backend.dto;

import com.gr7.backend.entity.Review;

import java.time.LocalDateTime;

/** Một lượt đánh giá; reviewerRole cho biết ai đánh giá ai (SV đánh giá NTD hay ngược lại). */
public record ReviewResponse(
        Long id, Long applicationId, Long jobId, String jobTitle,
        Long reviewerId, String reviewerName, String reviewerRole,
        Long revieweeId, String revieweeName,
        Integer rating, String comment, LocalDateTime createdAt
) {
    public static ReviewResponse from(Review r) {
        return new ReviewResponse(r.getId(), r.getApplication().getId(),
                r.getApplication().getJob().getId(), r.getApplication().getJob().getTitle(),
                r.getReviewer().getId(), r.getReviewer().getFullName(), r.getReviewer().getRole().name(),
                r.getReviewee().getId(), r.getReviewee().getFullName(),
                r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
