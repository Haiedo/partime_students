package com.gr7.backend.dto;

import com.gr7.backend.entity.JobStatus;
import jakarta.validation.constraints.NotNull;

/** Body của PATCH /api/jobs/{id}/status, ví dụ {"status":"FILLED"}. */
public record JobStatusRequest(@NotNull(message = "Vui lòng chọn trạng thái mới") JobStatus status) {}
