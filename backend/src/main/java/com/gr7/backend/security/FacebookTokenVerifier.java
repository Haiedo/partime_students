package com.gr7.backend.security;

import com.gr7.backend.entity.SocialProvider;
import com.gr7.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Xác minh access token do Facebook Login cấp (FR-21).
 * 1. Gọi debug_token bằng app token (App ID|App Secret): token phải còn hiệu lực và cấp cho đúng ứng dụng của nhóm.
 * 2. Gọi /me lấy id, tên, email. Facebook không trả email nếu tài khoản đăng ký bằng số điện thoại:
 *    khi đó email = null và người dùng nhập email ở MH-13.
 * App ID và App Secret đặt bằng biến môi trường FACEBOOK_APP_ID, FACEBOOK_APP_SECRET (không ghi vào mã nguồn).
 */
@Component
public class FacebookTokenVerifier {

    private final String appId;
    private final String appSecret;
    private final RestClient http;

    public FacebookTokenVerifier(@Value("${app.facebook.app-id:${FACEBOOK_APP_ID:}}") String appId,
                                 @Value("${app.facebook.app-secret:${FACEBOOK_APP_SECRET:}}") String appSecret,
                                 @Value("${app.facebook.graph-url:https://graph.facebook.com/v26.0}") String graphUrl) {
        this.appId = appId == null ? "" : appId.trim();
        this.appSecret = appSecret == null ? "" : appSecret.trim();
        this.http = RestClient.builder().baseUrl(graphUrl).build();
    }

    @SuppressWarnings("unchecked")
    public SocialProfile verify(String accessToken) {
        if (appId.isEmpty() || appSecret.isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Máy chủ chưa cấu hình đăng nhập Facebook (thiếu FACEBOOK_APP_ID, FACEBOOK_APP_SECRET)");
        }
        if (accessToken == null || accessToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token Facebook không hợp lệ");
        }
        try {
            Map<String, Object> debug = http.get()
                    .uri(b -> b.path("/debug_token")
                            .queryParam("input_token", accessToken)
                            .queryParam("access_token", appId + "|" + appSecret).build())
                    .retrieve().body(Map.class);
            Map<String, Object> data = debug == null ? null : (Map<String, Object>) debug.get("data");
            if (data == null || !Boolean.TRUE.equals(data.get("is_valid")) || !appId.equals(String.valueOf(data.get("app_id")))) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Token Facebook không hợp lệ hoặc đã hết hạn");
            }
            Map<String, Object> me = http.get()
                    .uri(b -> b.path("/me")
                            .queryParam("fields", "id,name,email")
                            .queryParam("access_token", accessToken).build())
                    .retrieve().body(Map.class);
            if (me == null || me.get("id") == null) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Không đọc được thông tin tài khoản Facebook");
            }
            Object email = me.get("email");
            String cleanEmail = email == null || String.valueOf(email).isBlank() ? null
                    : String.valueOf(email).trim().toLowerCase();
            // Facebook chỉ trả email chính đã được xác nhận nên coi là đã xác minh
            return new SocialProfile(SocialProvider.FACEBOOK, String.valueOf(me.get("id")), cleanEmail,
                    cleanEmail != null, me.get("name") == null ? null : String.valueOf(me.get("name")));
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token Facebook không hợp lệ hoặc đã hết hạn");
        }
    }
}
