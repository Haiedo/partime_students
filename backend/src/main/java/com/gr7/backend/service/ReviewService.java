package com.gr7.backend.service;

import com.gr7.backend.dto.ReviewRequest;
import com.gr7.backend.dto.ReviewResponse;
import com.gr7.backend.dto.ReviewSummary;
import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.Review;
import com.gr7.backend.entity.User;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.ReviewRepository;
import com.gr7.backend.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Đánh giá hai chiều sau công việc (PB-13).
 * Điều kiện: đơn đã được nhận (ACCEPTED) và tin đã hoàn thành (COMPLETED); mỗi bên đánh giá 1 lần cho mỗi đơn.
 * Sinh viên của đơn đánh giá nhà tuyển dụng; chủ tin đánh giá sinh viên.
 */
@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final ApplicationRepository applications;
    private final UserRepository users;

    public ReviewService(ReviewRepository reviews, ApplicationRepository applications, UserRepository users) {
        this.reviews = reviews;
        this.applications = applications;
        this.users = users;
    }

    @Transactional
    public ReviewResponse create(Long userId, Long applicationId, ReviewRequest req) {
        Application a = applications.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));
        User student = a.getStudent().getUser();
        User employer = a.getJob().getEmployer().getUser();
        User reviewer;
        User reviewee;
        if (student.getId().equals(userId)) {
            reviewer = student;
            reviewee = employer;
        } else if (employer.getId().equals(userId)) {
            reviewer = employer;
            reviewee = student;
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không tham gia công việc này nên không đánh giá được");
        }
        if (a.getStatus() != ApplicationStatus.ACCEPTED || a.getJob().getStatus() != JobStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ đánh giá được khi đơn đã được nhận và công việc đã hoàn thành");
        }
        if (reviews.existsByApplicationIdAndReviewerId(applicationId, userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá công việc này rồi");
        }
        Review r = new Review();
        r.setApplication(a);
        r.setReviewer(reviewer);
        r.setReviewee(reviewee);
        r.setRating(req.rating());
        r.setComment(req.comment() == null || req.comment().isBlank() ? null : req.comment().trim());
        try {
            return ReviewResponse.from(reviews.saveAndFlush(r));
        } catch (DataIntegrityViolationException e) {
            // Bấm gửi 2 lần cùng lúc: khóa UNIQUE(application_id, reviewer_id) chặn lại
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá công việc này rồi");
        }
    }

    /** Các đánh giá do chính mình viết – giao diện dùng để ẩn nút "Đánh giá" ở đơn đã đánh giá. */
    @Transactional(readOnly = true)
    public List<ReviewResponse> mine(Long userId) {
        return reviews.findByReviewerIdOrderByCreatedAtDesc(userId).stream().map(ReviewResponse::from).toList();
    }

    /** Điểm trung bình và danh sách đánh giá một người nhận được. */
    @Transactional(readOnly = true)
    public ReviewSummary forUser(Long userId) {
        User u = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        List<ReviewResponse> list = reviews.findByRevieweeIdOrderByCreatedAtDesc(userId).stream()
                .map(ReviewResponse::from).toList();
        double avg = list.stream().mapToInt(ReviewResponse::rating).average().orElse(0);
        return new ReviewSummary(u.getId(), u.getFullName(), Math.round(avg * 10) / 10.0, list.size(), list);
    }
}
