package com.gr7.backend.service;

import com.gr7.backend.dto.AvailabilityDto;
import com.gr7.backend.dto.JobSummary;
import com.gr7.backend.dto.PageResponse;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.entity.StudentProfile;
import com.gr7.backend.entity.WorkTimeSlots;
import com.gr7.backend.exception.ApiException;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.JobSpecifications;
import com.gr7.backend.repository.StudentProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MatchedJobService {

    private static final int MAX_PAGE_SIZE = 50;

    private final StudentProfileRepository students;
    private final JobPostRepository jobs;

    public MatchedJobService(StudentProfileRepository students, JobPostRepository jobs) {
        this.students = students;
        this.jobs = jobs;
    }

    @Transactional(readOnly = true)
    public AvailabilityDto getAvailability(Long userId) {
        return new AvailabilityDto(findStudent(userId).getAvailableSlots());
    }

    @Transactional
    public AvailabilityDto updateAvailability(Long userId, int availableSlots) {
        if ((availableSlots & ~WorkTimeSlots.ALL) != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khung giờ rảnh không hợp lệ");
        }
        StudentProfile s = findStudent(userId);
        s.setAvailableSlots(availableSlots);
        return new AvailabilityDto(s.getAvailableSlots());
    }

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> matchedJobs(Long userId, String category, String location,
                                                BigDecimal minSalary, SalaryUnit salaryUnit,
                                                String sort, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int slots = findStudent(userId).getAvailableSlots() & WorkTimeSlots.ALL;
        if (slots == 0) {
            return new PageResponse<>(List.of(), safePage, safeSize, 0, 0);
        }

        Sort order = "salary".equals(sort)
                ? Sort.by(Sort.Order.desc("salaryMax"), Sort.Order.desc("id"))
                : Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

        var result = jobs.findAll(
                JobSpecifications.matchingAvailability(slots, category, location, minSalary, salaryUnit),
                PageRequest.of(safePage, safeSize, order));
        return PageResponse.of(result, JobSummary::from);
    }

    private StudentProfile findStudent(Long userId) {
        return students.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ sinh viên"));
    }
}