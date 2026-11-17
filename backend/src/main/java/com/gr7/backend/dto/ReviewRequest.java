package com.gr7.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body của POST /api/applications/{id}/reviews: điểm 1–5, nhận xét không bắt buộc (PB-13). */
public record ReviewRequest(
        @NotNull(message = "Vui lòng chọn số điểm")
        @Min(value = 1, message = "Điểm thấp nhất là 1")
        @Max(value = 5, message = "Điểm cao nhất là 5")
        Integer rating,

        @Size(max = 500, message = "Nhận xét tối đa 500 ký tự")
        String comment
) {}
