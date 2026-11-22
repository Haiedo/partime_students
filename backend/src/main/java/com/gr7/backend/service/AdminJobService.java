package com.gr7.backend.service;

import com.gr7.backend.dto.AdminJobDetailResponse;
import com.gr7.backend.dto.AdminJobResponse;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.NotificationType;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.ApplicationRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class AdminJobService {

    private final JobPostRepository jobs;
    private final NotificationService notifications;
    private final JobService jobService;
    private final ApplicationRepository applications;

    public AdminJobService(JobPostRepository jobs, NotificationService notifications, JobService jobService, ApplicationRepository applications) {
        this.jobs = jobs;
        this.notifications = notifications;
        this.jobService = jobService;
        this.applications = applications;
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> list(Boolean hidden, String status, String q) {
        String key = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        JobStatus st = parseStatus(status);
        return jobs.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(j -> hidden == null || (Boolean.FALSE.equals(hidden)
                        ? (!j.isHidden() && j.getStatus() != JobStatus.PENDING && j.getStatus() != JobStatus.REJECTED)
                        : j.isHidden()))
                .filter(j -> st == null || j.getStatus() == st)
                .filter(j -> key.isEmpty() || j.getTitle().toLowerCase(Locale.ROOT).contains(key)
                        || j.getEmployer().getCompanyName().toLowerCase(Locale.ROOT).contains(key))
                .map(AdminJobResponse::from)
                .toList();
    }

    /** Duyệt tin chờ duyệt (hoặc duyệt lại tin đã từ chối) -> OPEN, hiển thị công khai và báo sinh viên phù hợp. */
    @Transactional
    public AdminJobResponse approve(Long jobId) {
        JobPost j = find(jobId);
        if (j.getStatus() != JobStatus.PENDING && j.getStatus() != JobStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ duyệt được tin đang chờ duyệt hoặc đã từ chối");
        }
        j.setStatus(JobStatus.OPEN);
        j.setRejectReason(null);
        j.setHidden(false);
        notifications.create(j.getEmployer().getUser(), NotificationType.JOB_STATUS_CHANGED,
                "Tin " + NotificationService.quote(j.getTitle()) + " đã được duyệt và đang hiển thị tuyển dụng",
                "/jobs/" + j.getId());
        jobService.notifyMatchingStudents(j);
        return AdminJobResponse.from(j);
    }

    /** Từ chối tin chờ duyệt kèm lý do -> REJECTED, báo NTD để chỉnh sửa gửi lại. */
    @Transactional
    public AdminJobResponse reject(Long jobId, String reason) {
        JobPost j = find(jobId);
        if (j.getStatus() != JobStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ từ chối được tin đang ở trạng thái chờ duyệt");
        }
        String cleanReason = (reason == null || reason.isBlank()) ? null : reason.trim();
        j.setStatus(JobStatus.REJECTED);
        j.setRejectReason(cleanReason);
        String msg = "Tin " + NotificationService.quote(j.getTitle()) + " chưa được duyệt"
                + (cleanReason != null ? ". Lý do: " + cleanReason : "");
        notifications.create(j.getEmployer().getUser(), NotificationType.JOB_STATUS_CHANGED,
                msg.length() > 255 ? msg.substring(0, 252) + "..." : msg,
                "/employer/jobs");
        return AdminJobResponse.from(j);
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

    private static JobStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return JobStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái tin không hợp lệ");
        }
    }

    @Transactional(readOnly = true)
    public AdminJobDetailResponse detail(Long jobId) {
        JobPost j = find(jobId);
        return AdminJobDetailResponse.from(j, applications.countByJobId(jobId));
    }
}