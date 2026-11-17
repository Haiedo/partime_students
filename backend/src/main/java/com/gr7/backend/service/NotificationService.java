package com.gr7.backend.service;

import com.gr7.backend.dto.NotificationList;
import com.gr7.backend.dto.NotificationResponse;
import com.gr7.backend.entity.Notification;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.entity.User;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Thông báo trong hệ thống (PB-14).
 * create() được gọi ngay trong giao dịch của thao tác gốc (ứng tuyển, duyệt đơn, đổi trạng thái tin):
 * thao tác lỗi thì thông báo cũng không được lưu.
 */
@Service
public class NotificationService {

    private static final int MAX_MESSAGE = 255;

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional
    public void create(User to, NotificationType type, String message, String link) {
        Notification n = new Notification();
        n.setUser(to);
        n.setType(type);
        n.setMessage(message.length() > MAX_MESSAGE ? message.substring(0, MAX_MESSAGE - 3) + "..." : message);
        n.setLink(link);
        notifications.save(n);
    }

    @Transactional(readOnly = true)
    public NotificationList mine(Long userId) {
        return new NotificationList(notifications.countByUserIdAndReadFalse(userId),
                notifications.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(NotificationResponse::from).toList());
    }

    /** Thông báo không tồn tại → 404; của người khác → 403. */
    @Transactional
    public NotificationResponse markRead(Long userId, Long id) {
        Notification n = notifications.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo"));
        if (!n.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không xem được thông báo của người khác");
        }
        n.setRead(true);
        return NotificationResponse.from(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notifications.findByUserIdAndReadFalse(userId).forEach(n -> n.setRead(true));
    }

    /** Rút gọn tên tin cho vừa câu thông báo. */
    static String quote(String title) {
        return "\"" + (title.length() > 60 ? title.substring(0, 57) + "..." : title) + "\"";
    }
}
