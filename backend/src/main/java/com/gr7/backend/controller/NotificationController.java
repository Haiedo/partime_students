package com.gr7.backend.controller;

import com.gr7.backend.dto.NotificationList;
import com.gr7.backend.dto.NotificationResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Chuông thông báo (PB-14). Mọi vai trò đã đăng nhập đều dùng được. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public NotificationList mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(CurrentUser.id(jwt));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.markRead(CurrentUser.id(jwt), id);
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        service.markAllRead(CurrentUser.id(jwt));
        return ResponseEntity.noContent().build();
    }
}
