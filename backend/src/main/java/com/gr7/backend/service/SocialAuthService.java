package com.gr7.backend.service;

import com.gr7.backend.dto.AuthResponse;
import com.gr7.backend.dto.SocialCompleteRequest;
import com.gr7.backend.dto.SocialSignupResponse;
import com.gr7.backend.entity.Role;
import com.gr7.backend.entity.SocialAccount;
import com.gr7.backend.entity.User;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.SocialAccountRepository;
import com.gr7.backend.repository.UserRepository;
import com.gr7.backend.security.SignupTokenService;
import com.gr7.backend.security.SocialProfile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Đăng nhập bằng Google / Facebook (PB-17, PB-18). Sau khi token đã được xác minh:
 * 1. Đã liên kết trước đó -> đăng nhập luôn (200).
 * 2. Chưa liên kết nhưng email đã có tài khoản -> liên kết vào tài khoản đó, không tạo trùng (200).
 * 3. Người mới -> trả signupToken (202) để chọn vai trò ở MH-13, rồi gọi complete() (201).
 */
@Service
public class SocialAuthService {

    private final SocialAccountRepository socials;
    private final UserRepository users;
    private final AuthService authService;
    private final SignupTokenService signupTokens;

    public SocialAuthService(SocialAccountRepository socials, UserRepository users,
                             AuthService authService, SignupTokenService signupTokens) {
        this.socials = socials;
        this.users = users;
        this.authService = authService;
        this.signupTokens = signupTokens;
    }

    /** Kết quả: đúng một trong hai trường khác null. */
    public record Result(AuthResponse login, SocialSignupResponse signup) {}

    @Transactional
    public Result login(SocialProfile p) {
        Optional<SocialAccount> linked = socials.findByProviderAndProviderUserId(p.provider(), p.providerUserId());
        if (linked.isPresent()) {
            return new Result(authService.issueToken(linked.get().getUser()), null);
        }
        // Chỉ liên kết theo email khi nhà cung cấp đã xác minh email đó
        if (p.email() != null && p.emailVerified()) {
            Optional<User> byEmail = users.findByEmail(p.email());
            if (byEmail.isPresent()) {
                AuthResponse token = authService.issueToken(byEmail.get());   // bị khóa -> 403, không liên kết
                socials.save(new SocialAccount(byEmail.get(), p.provider(), p.providerUserId(), p.email()));
                return new Result(token, null);
            }
        }
        return new Result(null, new SocialSignupResponse(signupTokens.create(p), p.email(), p.fullName(), true));
    }

    /** Bước 2 lần đầu đăng nhập: tạo tài khoản theo vai trò đã chọn rồi đăng nhập luôn. */
    @Transactional
    public AuthResponse complete(SocialCompleteRequest req) {
        SocialProfile p = signupTokens.read(req.signupToken());
        if (socials.findByProviderAndProviderUserId(p.provider(), p.providerUserId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Tài khoản này đã được tạo, vui lòng đăng nhập lại");
        }
        String email = p.email() != null ? p.email()
                : (req.email() == null ? "" : req.email().trim().toLowerCase());
        if (email.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập email để hoàn tất tài khoản");
        }
        User user = authService.createAccount(email, null, req.fullName(), Role.valueOf(req.role()));
        socials.save(new SocialAccount(user, p.provider(), p.providerUserId(), p.email()));
        return authService.issueToken(user);
    }
}
