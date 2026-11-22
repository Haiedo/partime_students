package com.gr7.backend.dto;

import jakarta.validation.constraints.Size;

/** Body của PATCH /api/admin/jobs/{id}/reject (lý do không bắt buộc, tối đa 500 ký tự). */
public record RejectJobRequest(
        @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
        String reason
) {}