package com.gr7.backend.entity;

/**
 * Trạng thái tin: OPEN (đang tuyển) → FILLED (đã đủ người) → COMPLETED (hoàn thành).
 * CLOSED là đóng tin giữa chừng, đi bằng API đóng tin riêng (PB-06).
 */
public enum JobStatus {
    OPEN, FILLED, COMPLETED, CLOSED;

    /** Chỉ cho đi tới đúng bước kế tiếp; nhảy cóc hoặc quay ngược đều sai (PB-12). */
    public boolean canMoveTo(JobStatus next) {
        return (this == OPEN && next == FILLED) || (this == FILLED && next == COMPLETED);
    }
}
