package com.gr7.backend.dto;

/**
 * 202 – lần đầu đăng nhập bằng Google / Facebook: cần chọn vai trò (MH-13).
 * email = null khi Facebook không trả email, người dùng phải nhập ở bước sau.
 */
public record SocialSignupResponse(String signupToken, String email, String fullName, boolean needRole) {}
