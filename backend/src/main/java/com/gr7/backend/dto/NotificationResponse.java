package com.gr7.backend.dto;

import com.gr7.backend.entity.Notification;

import java.time.LocalDateTime;

/** Một thông báo trong chuông thông báo (PB-14); link là đường dẫn trang để bấm vào. */
public record NotificationResponse(Long id, String type, String message, String link, boolean read, LocalDateTime createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType().name(), n.getMessage(), n.getLink(),
                n.isRead(), n.getCreatedAt());
    }
}
