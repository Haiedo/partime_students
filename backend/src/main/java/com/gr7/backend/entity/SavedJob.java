package com.gr7.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Bảng saved_jobs – tin sinh viên đã lưu; UNIQUE(student_id, job_id) nên mỗi tin chỉ lưu 1 lần (FR-23). */
@Entity
@Table(name = "saved_jobs",
       uniqueConstraints = @UniqueConstraint(name = "uq_saved_student_job", columnNames = {"student_id", "job_id"}))
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPost job;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    public SavedJob() {}

    public SavedJob(StudentProfile student, JobPost job) {
        this.student = student;
        this.job = job;
    }

    public Long getId() { return id; }
    public StudentProfile getStudent() { return student; }
    public JobPost getJob() { return job; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
