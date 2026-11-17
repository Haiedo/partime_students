package com.gr7.backend.service;

import com.gr7.backend.entity.PasswordResetToken;
import com.gr7.backend.entity.User;
import com.gr7.backend.entity.UserStatus;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.PasswordResetTokenRepository;
import com.gr7.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Quên mật khẩu (PB-19, FR-22).
 * - Mã ngẫu nhiên 32 byte gửi qua email; CSDL chỉ lưu SHA-256 của mã.
 * - Hạn 15 phút, dùng 1 lần; yêu cầu mã mới thì mã cũ hết hiệu lực.
 * - Email có tồn tại hay không đều trả cùng một câu, tránh dò email đã đăng ký.
 */
@Service
public class PasswordResetService {

    public static final String SENT_MESSAGE = "Nếu email đã đăng ký, chúng tôi đã gửi đường dẫn đặt lại mật khẩu";
    private static final int MINUTES = 15;

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final String frontendUrl;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens, PasswordEncoder encoder,
                                MailService mail, @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mail = mail;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Transactional
    public void forgot(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        users.findByEmail(email)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .ifPresent(this::sendCode);
    }

    private void sendCode(User u) {
        LocalDateTime now = LocalDateTime.now();
        tokens.invalidateAll(u.getId(), now);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new PasswordResetToken(u, sha256(code), now.plusMinutes(MINUTES)));

        String link = frontendUrl + "/reset-password?token=" + code;
        mail.send(u.getEmail(), "PartTimeSV - Đặt lại mật khẩu",
                "Chào " + u.getFullName() + ",\n\n"
                + "Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu tài khoản PartTimeSV.\n"
                + "Mở đường dẫn sau trong " + MINUTES + " phút để đặt mật khẩu mới:\n" + link + "\n\n"
                + "Nếu không phải bạn yêu cầu, hãy bỏ qua email này, mật khẩu hiện tại vẫn giữ nguyên.\n\n"
                + "PartTimeSV");
    }

    /** Mã sai, hết hạn hoặc đã dùng -> 400. Tài khoản chỉ có Google/Facebook cũng đặt được mật khẩu bằng cách này. */
    @Transactional
    public void reset(String code, String newPassword) {
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken t = tokens.findByTokenHash(sha256(code.trim()))
                .filter(x -> x.isUsable(now))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Đường dẫn đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được dùng"));
        t.setUsedAt(now);
        t.getUser().setPasswordHash(encoder.encode(newPassword));
    }

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
