package com.gr7.backend.dto;

import java.util.List;

/** Kết quả GET /api/notifications/me: số chưa đọc + 30 thông báo mới nhất. */
public record NotificationList(long unreadCount, List<NotificationResponse> items) {}
