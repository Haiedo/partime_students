package com.gr7.backend.controller;

import com.gr7.backend.dto.AdminUserResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.service.AdminUserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Tab Người dùng của trang Quản trị (PB-15). Nằm dưới /api/admin/** nên chỉ ADMIN gọi được. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminUserResponse> list(@RequestParam(required = false) String role,
                                        @RequestParam(required = false) String q) {
        return service.list(role, q);
    }

    @PatchMapping("/{id}/lock")
    public AdminUserResponse lock(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.lock(CurrentUser.id(jwt), id);
    }

    @PatchMapping("/{id}/unlock")
    public AdminUserResponse unlock(@PathVariable Long id) {
        return service.unlock(id);
    }
}
