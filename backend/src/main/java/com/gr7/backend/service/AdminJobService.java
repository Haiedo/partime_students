package com.gr7.backend.service;

import com.gr7.backend.dto.AdminJobResponse;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Kiểm duyệt tin cho Admin (PB-16): ẩn tin vi phạm thay vì xóa cứng (cột job_posts.hidden).
 * Tin ẩn tự biến mất khỏi tìm kiếm (JobSpecifications), xem chi tiết (JobSearchService) và không nhận đơn mới.
 */
@Service
public class AdminJobService {

    private final JobPostRepository jobs;
    private final NotificationService notifications;

    public AdminJobService(JobPostRepository jobs, NotificationService notifications) {
        this.jobs = jobs;
        this.notifications = notifications;
    }

    /** hidden: true = chỉ tin đã ẩn, false = chỉ tin đang hiện, bỏ trống = tất cả; q: tìm theo tiêu đề, công ty. */
    @Transactional(readOnly = true)
    public List<AdminJobResponse> list(Boolean hidden, String q) {
        String key = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return jobs.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(j -> hidden == null || j.isHidden() == hidden)
                .filter(j -> key.isEmpty() || j.getTitle().toLowerCase(Locale.ROOT).contains(key)
                        || j.getEmployer().getCompanyName().toLowerCase(Locale.ROOT).contains(key))
                .map(AdminJobResponse::from)
                .toList();
    }

    @Transactional
    public AdminJobResponse hide(Long jobId) {
        JobPost j = find(jobId);
        if (j.isHidden()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin này đã bị ẩn trước đó");
        }
        j.setHidden(true);
        notifications.create(j.getEmployer().getUser(), NotificationType.JOB_STATUS_CHANGED,
                "Tin " + NotificationService.quote(j.getTitle()) + " đã bị quản trị viên ẩn do vi phạm quy định đăng tin",
                "/employer/jobs");
        return AdminJobResponse.from(j);
    }

    /** Hiện lại tin khi ẩn nhầm. */
    @Transactional
    public AdminJobResponse unhide(Long jobId) {
        JobPost j = find(jobId);
        if (!j.isHidden()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tin này đang hiển thị");
        }
        j.setHidden(false);
        return AdminJobResponse.from(j);
    }

    private JobPost find(Long jobId) {
        return jobs.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tin tuyển dụng"));
    }
}
