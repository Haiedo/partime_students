package com.gr7.backend.controller;

import com.gr7.backend.dto.AuthResponse;
import com.gr7.backend.dto.GoogleLoginRequest;
import com.gr7.backend.dto.LoginRequest;
import com.gr7.backend.dto.RegisterRequest;
import com.gr7.backend.dto.SocialCompleteRequest;
import com.gr7.backend.dto.UserResponse;
import com.gr7.backend.security.CurrentUser;
import com.gr7.backend.security.GoogleTokenVerifier;
import com.gr7.backend.service.AuthService;
import com.gr7.backend.service.SocialAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SocialAuthService socialAuth;
    private final GoogleTokenVerifier google;

    public AuthController(AuthService authService, SocialAuthService socialAuth, GoogleTokenVerifier google) {
        this.authService = authService;
        this.socialAuth = socialAuth;
        this.google = google;
    }

    /** 201 khi đăng ký thành công; 400 dữ liệu sai; 409 email đã tồn tại. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    /** 200 kèm token; 401 sai email/mật khẩu; 403 tài khoản bị khóa. */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    /** Frontend gọi khi tải lại trang để biết ai đang đăng nhập. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.id(jwt));
    }

    /** PB-17: 200 + token (đã có tài khoản); 202 + signupToken (lần đầu); 401 token sai; 403 bị khóa. */
    @PostMapping("/google")
    public ResponseEntity<?> google(@Valid @RequestBody GoogleLoginRequest req) {
        return social(socialAuth.login(google.verify(req.idToken())));
    }

    /** MH-13: chọn vai trò lần đầu. 201 + token; 400 signupToken hết hạn; 409 email đã dùng. */
    @PostMapping("/social/complete")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse completeSocial(@Valid @RequestBody SocialCompleteRequest req) {
        return socialAuth.complete(req);
    }

    private static ResponseEntity<?> social(SocialAuthService.Result r) {
        return r.login() != null
                ? ResponseEntity.ok(r.login())
                : ResponseEntity.status(HttpStatus.ACCEPTED).body(r.signup());
    }
}
