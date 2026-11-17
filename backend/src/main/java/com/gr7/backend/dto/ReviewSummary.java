package com.gr7.backend.dto;

import java.util.List;

/** Điểm trung bình (làm tròn 1 chữ số) và các lượt đánh giá mà một người nhận được. */
public record ReviewSummary(Long userId, String fullName, double average, int count, List<ReviewResponse> reviews) {}
