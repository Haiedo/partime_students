package com.gr7.backend.service;

import com.gr7.backend.dto.AdminJobResponse;
import com.gr7.backend.dto.AdminUserDetailResponse;
import com.gr7.backend.dto.AdminUserResponse;
import com.gr7.backend.dto.MyApplicationResponse;
import com.gr7.backend.entity.EmployerProfile;
import com.gr7.backend.entity.Role;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.User;
import com.gr7.backend.entity.UserStatus;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.ApplicationRepository;
import com.gr7.backend.repository.EmployerProfileRepository;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import com.gr7.backend.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Quản lý người dùng cho Admin (PB-15): xem danh sách, khóa / mở khóa.
 * Tài khoản bị khóa không đăng nhập được: AuthService.issueToken trả 403 cho mọi cách đăng nhập.
 */
@Service
public class AdminUserService {

    private final UserRepository users;
    private final StudentProfileRepository students;
    private final EmployerProfileRepository employers;
    private final JobPostRepository jobs;
    private final ApplicationRepository applications;

    public AdminUserService(UserRepository users, StudentProfileRepository students,
                            EmployerProfileRepository employers, JobPostRepository jobs,
                            ApplicationRepository applications) {
        this.users = users;
        this.students = students;
        this.employers = employers;
        this.jobs = jobs;
        this.applications = applications;
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse detail(Long userId) {
        User u = find(userId);
        StudentProfile sp = null;
        List<MyApplicationResponse> apps = List.of();
        EmployerProfile ep = null;
        List<AdminJobResponse> empJobs = List.of();

        if (u.getRole() == Role.STUDENT) {
            sp = students.findByUserId(userId).orElse(null);
            if (sp != null) {
                apps = applications.findByStudentIdOrderByAppliedAtDesc(sp.getId()).stream()
                        .map(MyApplicationResponse::from)
                        .toList();
            }
        } else if (u.getRole() == Role.EMPLOYER) {
            ep = employers.findByUserId(userId).orElse(null);
            if (ep != null) {
                empJobs = jobs.findByEmployerIdOrderByCreatedAtDesc(ep.getId()).stream()
                        .map(AdminJobResponse::from)
                        .toList();
            }
        }
        return AdminUserDetailResponse.from(u, sp, apps, ep, empJobs);
    }

    /** role: STUDENT | EMPLOYER | ADMIN hoặc bỏ trống; q: tìm trong email, họ tên. Mới đăng ký đứng đầu. */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> list(String role, String q) {
        String key = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        Role r = parseRole(role);
        return users.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(u -> r == null || u.getRole() == r)
                .filter(u -> key.isEmpty() || u.getEmail().toLowerCase(Locale.ROOT).contains(key)
                        || u.getFullName().toLowerCase(Locale.ROOT).contains(key))
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse lock(Long adminId, Long userId) {
        User u = find(userId);
        if (u.getId().equals(adminId) || u.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không được khóa tài khoản quản trị viên");
        }
        if (u.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này đã bị khóa trước đó");
        }
        u.setStatus(UserStatus.LOCKED);
        return AdminUserResponse.from(u);
    }

    @Transactional
    public AdminUserResponse unlock(Long userId) {
        User u = find(userId);
        if (u.getStatus() == UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tài khoản này đang hoạt động, không cần mở khóa");
        }
        u.setStatus(UserStatus.ACTIVE);
        return AdminUserResponse.from(u);
    }

    private User find(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private static Role parseRole(String role) {
        if (role == null || role.isBlank()) return null;
        try {
            return Role.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ, chỉ nhận STUDENT, EMPLOYER hoặc ADMIN");
        }
    }
    
}
