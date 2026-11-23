package com.gr7.backend.service;

import com.gr7.backend.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Danh sách kỹ năng sinh viên được chọn trong hồ sơ.
 * Phải giống danh sách ở frontend: src/utils/skills.js.
 * Sinh viên chỉ chọn trong danh sách, không nhập tay; lưu thành chuỗi "Giao tiếp, Làm việc nhóm".
 */
public final class SkillCatalog {

    public static final int MAX = 10;

    public static final List<String> ALL = List.of(
            // Kỹ năng mềm
            "Giao tiếp", "Làm việc nhóm", "Thuyết trình", "Giải quyết vấn đề", "Quản lý thời gian",
            "Chịu được áp lực", "Chăm sóc khách hàng", "Bán hàng", "Tư vấn", "Sáng tạo",
            // Tin học và ngoại ngữ
            "Tin học văn phòng", "Excel", "Nhập liệu", "Tiếng Anh", "Tiếng Trung", "Tiếng Nhật", "Tiếng Hàn",
            // Chuyên môn
            "Pha chế", "Phục vụ", "Thu ngân", "Gia sư", "Thiết kế đồ họa", "Chụp ảnh", "Viết nội dung",
            "Quản lý mạng xã hội", "Lập trình", "Lái xe máy");

    private static final Map<String, String> BY_KEY = new LinkedHashMap<>();

    static {
        for (String s : ALL) BY_KEY.put(s.toLowerCase(Locale.ROOT), s);
    }

    private SkillCatalog() {
    }

    /**
     * Kiểm tra và chuẩn hóa chuỗi kỹ năng gửi lên: bỏ trùng, đúng chữ hoa thường, sắp theo thứ tự danh sách.
     * Rỗng thì trả về null. Có kỹ năng ngoài danh sách hoặc quá MAX kỹ năng thì báo lỗi 400.
     */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return null;
        List<String> picked = new ArrayList<>();
        for (String part : raw.split(",")) {
            String s = part.trim();
            if (s.isEmpty()) continue;
            String k = BY_KEY.get(s.toLowerCase(Locale.ROOT));
            if (k == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Kỹ năng \"" + s + "\" không có trong danh sách");
            }
            if (!picked.contains(k)) picked.add(k);
        }
        if (picked.isEmpty()) return null;
        if (picked.size() > MAX) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chọn tối đa " + MAX + " kỹ năng");
        }
        return String.join(", ", ALL.stream().filter(picked::contains).toList());
    }
}
