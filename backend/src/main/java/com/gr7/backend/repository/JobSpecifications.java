package com.gr7.backend.repository;

import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.JobStatus;
import com.gr7.backend.entity.SalaryUnit;
import com.gr7.backend.entity.WorkTimeSlots;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Điều kiện tìm kiếm động cho GET /api/jobs (PB-07).
 * Chỉ lấy tin đang tuyển (OPEN) và chưa bị ẩn; mỗi bộ lọc có giá trị thì thêm một điều kiện AND.
 * Lọc thời gian rảnh (days, shifts) dùng cột shift_slots, xem WorkTimeSlots.
 */
public final class JobSpecifications {

    private JobSpecifications() {}

    public static Specification<JobPost> search(String keyword, String category, String location,
                                                BigDecimal minSalary, BigDecimal maxSalary, SalaryUnit unit,
                                                WorkTimeSlots.TimeFilter timeFilter) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), JobStatus.OPEN));
            ps.add(cb.isFalse(root.<Boolean>get("hidden")));

            if (hasText(keyword)) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), kw),
                        cb.like(cb.lower(root.<String>get("description")), kw),
                        cb.like(cb.lower(root.get("employer").<String>get("companyName")), kw)));
            }
            if (hasText(category)) {
                ps.add(cb.equal(root.get("category"), category.trim()));
            }
            if (hasText(location)) {
                ps.add(cb.like(cb.lower(root.<String>get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (unit != null) {
                ps.add(cb.equal(root.get("salaryUnit"), unit));
            }
            // Mức lương cao nhất của tin phải đạt mức sinh viên mong muốn
            if (minSalary != null) {
                Expression<BigDecimal> top = cb.coalesce(root.<BigDecimal>get("salaryMax"), root.<BigDecimal>get("salaryMin"));
                ps.add(cb.greaterThanOrEqualTo(top, minSalary));
            }
            // Mức lương thấp nhất của tin không vượt quá mức trần đã chọn
            if (maxSalary != null) {
                Expression<BigDecimal> low = cb.coalesce(root.<BigDecimal>get("salaryMin"), root.<BigDecimal>get("salaryMax"));
                ps.add(cb.lessThanOrEqualTo(low, maxSalary));
            }
            // Thời gian rảnh: tin có ít nhất một buổi trùng với các ngày/buổi sinh viên chọn
            // bitand là hàm có sẵn của Hibernate, với MySQL được dịch thành (shift_slots & mask)
            if (timeFilter != null) {
                Expression<Integer> slots = root.<Integer>get("shiftSlots");

                // 1. Có ngày/buổi trùng với khung lọc
                Expression<Integer> match = cb.function("bitand", Integer.class,
                        slots, cb.literal(timeFilter.matchMask()));
                ps.add(cb.notEqual(match, 0));

                // 2. Không có phần giờ nào lấn ra ngoài buổi đã lọc
                if (timeFilter.forbiddenMask() != 0) {
                    Expression<Integer> outside = cb.function("bitand", Integer.class,
                            slots, cb.literal(timeFilter.forbiddenMask()));
                    ps.add(cb.equal(outside, 0));
                }

                // 3. Nếu lọc "Cả ngày" -> bắt buộc có bit FULL_DAY_BIT
                if (timeFilter.requireFullDay()) {
                    Expression<Integer> fullDay = cb.function("bitand", Integer.class,
                            slots, cb.literal(WorkTimeSlots.FULL_DAY_BIT));
                    ps.add(cb.notEqual(fullDay, 0));
                }
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    /** Lọc tin có toàn bộ ca làm nằm gọn trong khung giờ rảnh của sinh viên + lọc ngành, địa điểm, lương. */
    public static Specification<JobPost> matchingAvailability(int availableSlots, String category, String location,
                                                              BigDecimal minSalary, SalaryUnit unit) {
        int safeAvailable = availableSlots & WorkTimeSlots.ALL;
        int busyMask = WorkTimeSlots.ALL & ~safeAvailable;
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), JobStatus.OPEN));
            ps.add(cb.isFalse(root.<Boolean>get("hidden")));

            Expression<Integer> slots = root.<Integer>get("shiftSlots");
            // Phải có ít nhất 1 buổi nằm trong khung rảnh
            ps.add(cb.notEqual(cb.function("bitand", Integer.class, slots, cb.literal(safeAvailable)), 0));
            // Không có bất kỳ buổi nào rơi vào khung giờ bận của sinh viên
            if (busyMask != 0) {
                ps.add(cb.equal(cb.function("bitand", Integer.class, slots, cb.literal(busyMask)), 0));
            }

            if (hasText(category)) {
                ps.add(cb.equal(root.get("category"), category.trim()));
            }
            if (hasText(location)) {
                ps.add(cb.like(cb.lower(root.<String>get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (unit != null) {
                ps.add(cb.equal(root.get("salaryUnit"), unit));
            }
            if (minSalary != null) {
                Expression<BigDecimal> top = cb.coalesce(root.<BigDecimal>get("salaryMax"), root.<BigDecimal>get("salaryMin"));
                ps.add(cb.greaterThanOrEqualTo(top, minSalary));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
