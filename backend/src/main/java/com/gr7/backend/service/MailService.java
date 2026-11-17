package com.gr7.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Gửi email văn bản thuần, chạy bất đồng bộ (@Async).
 * Chưa cấu hình SMTP (biến SPRING_MAIL_HOST...) thì chỉ ghi nội dung email ra log để chạy thử trên máy.
 * Lỗi SMTP chỉ ghi log, không làm hỏng thao tác đang làm.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> senders;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> senders,
                       @Value("${app.mail.from:PartTimeSV <no-reply@parttimesv.local>}") String from) {
        this.senders = senders;
        this.from = from;
    }

    @Async
    public void send(String to, String subject, String text) {
        JavaMailSender sender = senders.getIfAvailable();
        if (sender == null) {
            log.info("[Email - chưa cấu hình SMTP, chỉ ghi log] Tới: {} | Tiêu đề: {}\n{}", to, subject, text);
            return;
        }
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(from);
            m.setTo(to);
            m.setSubject(subject);
            m.setText(text);
            sender.send(m);
        } catch (MailException e) {
            log.warn("Không gửi được email tới {}: {}", to, e.getMessage());
        }
    }
}
