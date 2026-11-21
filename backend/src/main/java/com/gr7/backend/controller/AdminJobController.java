package com.gr7.backend.controller;

import com.gr7.backend.dto.AdminJobResponse;
import com.gr7.backend.service.AdminJobService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Tab Tin đăng của trang Quản trị (PB-16). Nằm dưới /api/admin/** nên chỉ ADMIN gọi được. */
@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    private final AdminJobService service;

    public AdminJobController(AdminJobService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminJobResponse> list(@RequestParam(required = false) Boolean hidden,
                                       @RequestParam(required = false) String q) {
        return service.list(hidden, q);
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
