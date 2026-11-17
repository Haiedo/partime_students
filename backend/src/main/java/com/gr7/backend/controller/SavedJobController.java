package com.gr7.backend.controller;

import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.dto.SavedJobResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.SavedJobService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** MH-15 – Việc đã lưu (PB-20). Chỉ STUDENT gọi được (/api/students/** trong SecurityConfig). */
@RestController
@RequestMapping("/api/students/me/saved-jobs")
public class SavedJobController {

    private final SavedJobService service;

    public SavedJobController(SavedJobService service) {
        this.service = service;
    }

    /** Mới lưu nhất lên đầu. */
    @GetMapping
    public PageResponse<SavedJobResponse> list(@AuthenticationPrincipal Jwt jwt,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return service.list(CurrentUser.id(jwt), page, size);
    }

    /** 204; gọi lại nhiều lần vẫn 204; 404 tin không tồn tại hoặc đã bị gỡ. */
    @PutMapping("/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@AuthenticationPrincipal Jwt jwt, @PathVariable Long jobId) {
        service.save(CurrentUser.id(jwt), jobId);
    }

    /** 204; 404 chưa lưu tin này. */
    @DeleteMapping("/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal Jwt jwt, @PathVariable Long jobId) {
        service.remove(CurrentUser.id(jwt), jobId);
    }
}
