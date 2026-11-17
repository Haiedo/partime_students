package com.gr7.backend.controller;

import com.gr7.backend.dto.ReviewRequest;
import com.gr7.backend.dto.ReviewResponse;
import com.gr7.backend.dto.ReviewSummary;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Đánh giá hai chiều (PB-13). Cần đăng nhập; quyền SV / NTD được kiểm tra trong ReviewService. */
@RestController
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping("/api/applications/{id}/reviews")
    public ResponseEntity<ReviewResponse> create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                 @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(CurrentUser.id(jwt), id, req));
    }

    @GetMapping("/api/reviews/me")
    public List<ReviewResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(CurrentUser.id(jwt));
    }

    @GetMapping("/api/users/{id}/reviews")
    public ReviewSummary forUser(@PathVariable Long id) {
        return service.forUser(id);
    }
}
