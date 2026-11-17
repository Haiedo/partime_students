package com.gr7.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Bật @Async: gửi email ở luồng riêng, API trả kết quả ngay không chờ máy chủ SMTP. */
@Configuration
@EnableAsync
public class AsyncConfig {
}
