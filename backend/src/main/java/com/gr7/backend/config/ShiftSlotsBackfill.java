package com.gr7.backend.config;

import com.gr7.backend.entity.JobPost;
import com.gr7.backend.repository.JobPostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Chạy mỗi lần khởi động: tin có shift_slots = 0 (tin cũ trước khi thêm cột, hoặc nạp bằng seed_1000_jobs.sql)
 * được quy đổi từ chuỗi work_time để lọc theo thời gian rảnh hoạt động đúng.
 */
@Component
@Order(10)
public class ShiftSlotsBackfill implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ShiftSlotsBackfill.class);

    private final JobPostRepository jobs;

    public ShiftSlotsBackfill(JobPostRepository jobs) {
        this.jobs = jobs;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<JobPost> missing = jobs.findByShiftSlots(0);
        if (missing.isEmpty()) return;
        missing.forEach(j -> j.setWorkTime(j.getWorkTime()));   // setWorkTime tự tính lại shiftSlots
        jobs.saveAll(missing);
        log.info("Đã quy đổi ca làm cho {} tin cũ", missing.size());
    }
}
