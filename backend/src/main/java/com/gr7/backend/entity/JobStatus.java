package com.gr7.backend.entity;

/**
 * Trạng thái tin: PENDING (chờ duyệt) → OPEN (đang tuyển) → FILLED (đã đủ người) → COMPLETED (hoàn thành).
 * REJECTED: quản trị viên từ chối duyệt (NTD có thể sửa để gửi duyệt lại).
 * CLOSED: nhà tuyển dụng đóng tin giữa chừng.
 */
public enum JobStatus {
    PENDING, OPEN, FILLED, COMPLETED, CLOSED, REJECTED;

    public boolean canMoveTo(JobStatus next) {
        return (this == OPEN && next == FILLED) || (this == FILLED && next == COMPLETED);
    }
}