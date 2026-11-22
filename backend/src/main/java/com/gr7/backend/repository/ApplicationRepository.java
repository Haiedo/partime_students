package com.gr7.backend.repository;

import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndStudentId(Long jobId, Long studentId);
    List<Application> findByStudentIdOrderByAppliedAtDesc(Long studentId);
    List<Application> findByJobIdOrderByAppliedAtDesc(Long jobId);

    @EntityGraph(attributePaths = {"job", "student", "student.user"})
    List<Application> findByJobEmployerUserIdOrderByAppliedAtDesc(Long userId);

    long countByJobId(Long jobId);
    long countByJobIdAndStatus(Long jobId, ApplicationStatus status);
    List<Application> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
}