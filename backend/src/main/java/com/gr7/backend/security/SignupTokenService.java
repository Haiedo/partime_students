package com.gr7.backend.security;

import com.gr7.backend.entity.SocialProvider;
import com.gr7.backend.exception.ApiException;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * signupToken (hạn 10 phút): giữ thông tin Google / Facebook giữa 2 bước
 * "đăng nhập lần đầu" và "chọn vai trò" mà không cần lưu tạm vào CSDL.
 * Ký bằng khóa riêng (suy ra từ app.jwt.secret) nên không dùng thay token đăng nhập được.
 */
@Service
public class SignupTokenService {

    private static final long MINUTES = 10;

    private final NimbusJwtEncoder encoder;
    private final NimbusJwtDecoder decoder;

    public SignupTokenService(JwtProperties props) {
        SecretKey key = new SecretKeySpec(sha256(props.secret() + ":signup"), "HmacSHA256");
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    public String create(SocialProfile p) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer("parttime-sv-signup")
                .issuedAt(now)
                .expiresAt(now.plus(MINUTES, ChronoUnit.MINUTES))
                .subject(p.providerUserId())
                .claim("provider", p.provider().name())
                .claim("fullName", p.fullName() == null ? "" : p.fullName());
        if (p.email() != null) claims.claim("email", p.email());
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
    }

    /** Token sai hoặc quá 10 phút -> 400 (người dùng đăng nhập lại bằng Google / Facebook). */
    public SocialProfile read(String token) {
        try {
            Jwt jwt = decoder.decode(token);
            String email = jwt.getClaimAsString("email");
            return new SocialProfile(SocialProvider.valueOf(jwt.getClaimAsString("provider")), jwt.getSubject(),
                    email, email != null, jwt.getClaimAsString("fullName"));
        } catch (JwtException | IllegalArgumentException | NullPointerException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Phiên đăng ký đã hết hạn, vui lòng đăng nhập lại bằng Google hoặc Facebook");
        }
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
