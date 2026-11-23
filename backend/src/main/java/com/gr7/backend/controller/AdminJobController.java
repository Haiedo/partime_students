package com.gr7.backend.controller;

import com.gr7.backend.dto.AdminJobDetailResponse;
import com.gr7.backend.dto.AdminJobResponse;
import com.gr7.backend.dto.RejectJobRequest;
import com.gr7.backend.service.AdminJobService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    private final AdminJobService service;

    public AdminJobController(AdminJobService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminJobResponse> list(@RequestParam(required = false) Boolean hidden,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(required = false) String q) {
        return service.list(hidden, status, q);
    }

    @GetMapping("/{id}")
    public AdminJobDetailResponse detail(@PathVariable Long id) {
        return service.detail(id);
    }

    @PatchMapping("/{id}/approve")
    public AdminJobResponse approve(@PathVariable Long id) {
        return service.approve(id);
    }

    @PatchMapping("/{id}/reject")
    public AdminJobResponse reject(@PathVariable Long id,
                                   @Valid @RequestBody(required = false) RejectJobRequest req) {
        return service.reject(id, req == null ? null : req.reason());
    }

    @PatchMapping("/{id}/hide")
    public AdminJobResponse hide(@PathVariable Long id) {
        return service.hide(id);
    }

    @PatchMapping("/{id}/unhide")
    public AdminJobResponse unhide(@PathVariable Long id) {
        return service.unhide(id);
    }
}