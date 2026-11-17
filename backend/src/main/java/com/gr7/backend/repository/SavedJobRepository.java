package com.gr7.backend.repository;

import com.gr7.backend.entity.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    boolean existsByStudentIdAndJobId(Long studentId, Long jobId);
    Optional<SavedJob> findByStudentIdAndJobId(Long studentId, Long jobId);

    /** Tin bị Admin gỡ (hidden) không còn hiện trong danh sách đã lưu. */
    @EntityGraph(attributePaths = {"job", "job.employer"})
    Page<SavedJob> findByStudentIdAndJobHiddenFalseOrderByCreatedAtDesc(Long studentId, Pageable pageable);
}
