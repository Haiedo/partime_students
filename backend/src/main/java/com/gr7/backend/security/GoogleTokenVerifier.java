package com.gr7.backend.security;

import com.gr7.backend.entity.SocialProvider;
import com.gr7.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Xác minh ID token do Google Identity Services cấp (FR-20).
 * Kiểm tra chữ ký bằng khóa công khai của Google, hạn dùng, nơi cấp (accounts.google.com)
 * và aud phải đúng Client ID của nhóm. Dùng thư viện Nimbus có sẵn trong Spring Security.
 */
@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_KEYS = "https://www.googleapis.com/oauth2/v3/certs";

    private final String clientId;
    private volatile NimbusJwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public SocialProfile verify(String idToken) {
        if (clientId.isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Máy chủ chưa cấu hình đăng nhập Google (thiếu GOOGLE_CLIENT_ID)");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token Google không hợp lệ");
        }
        Jwt jwt;
        try {
            jwt = decoder().decode(idToken);
        } catch (JwtException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token Google không hợp lệ hoặc đã hết hạn");
        }
        Object verified = jwt.getClaims().get("email_verified");
        boolean emailVerified = Boolean.TRUE.equals(verified) || "true".equals(String.valueOf(verified));
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        return new SocialProfile(SocialProvider.GOOGLE, jwt.getSubject(),
                email == null ? null : email.trim().toLowerCase(), emailVerified, name);
    }

    private NimbusJwtDecoder decoder() {
        if (decoder == null) {
            NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(GOOGLE_KEYS).build();
            d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                    new JwtTimestampValidator(),
                    new JwtClaimValidator<Object>(JwtClaimNames.ISS,
                            iss -> iss != null && String.valueOf(iss).endsWith("accounts.google.com")),
                    new JwtClaimValidator<Object>(JwtClaimNames.AUD,
                            aud -> aud instanceof Collection<?> c ? c.contains(clientId) : clientId.equals(aud))));
            decoder = d;
        }
        return decoder;
    }
}
