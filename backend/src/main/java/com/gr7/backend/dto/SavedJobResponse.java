package com.gr7.backend.dto;

import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SavedJob;

import java.time.LocalDateTime;

/** Một dòng ở MH-15 – Việc đã lưu: thông tin thẻ tin + trạng thái tin + ngày lưu. */
public record SavedJobResponse(Long jobId, JobStatus status, LocalDateTime savedAt, JobSummary job) {

    public static SavedJobResponse from(SavedJob s) {
        return new SavedJobResponse(s.getJob().getId(), s.getJob().getStatus(), s.getCreatedAt(),
                JobSummary.from(s.getJob()));
    }
}
