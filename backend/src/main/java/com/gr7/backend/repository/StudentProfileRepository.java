package com.gr7.backend.repository;

import com.gr7.backend.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUserId(Long userId);

    /** Tìm sinh viên đang hoạt động có lịch rảnh bao trọn toàn bộ ca làm của tin (jobMask). */
    @Query("""
            select s from StudentProfile s
            join fetch s.user u
            where u.status = com.gr7.backend.entity.UserStatus.ACTIVE
              and s.availableSlots > 0
              and function('bitand', s.availableSlots, :jobMask) = :jobMask
            """)
    List<StudentProfile> findMatchingForJob(@Param("jobMask") int jobMask);
}