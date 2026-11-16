package com.gr7.backend.entity;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Quy chuỗi thời gian làm (work_time) ra ca làm theo tuần (shift_slots, FR-09, FR-26).
 * 21 bit = 7 ngày x 3 buổi: bit thứ (ngày x 3 + buổi), ngày 0 = Thứ Hai … 6 = Chủ Nhật,
 * buổi 0 = Sáng (trước 12:00), 1 = Chiều (12:00–18:00), 2 = Tối (từ 18:00).
 * Ví dụ "18:00–22:00, T2–T6" -> bật buổi Tối của Thứ Hai đến Thứ Sáu.
 * Không ghi ngày -> coi như mọi ngày; không ghi giờ/buổi -> coi như mọi buổi (vd "Linh hoạt").
 */
public final class WorkTimeSlots {

    public static final int ALL = (1 << 21) - 1;
    public static final String[] DAYS = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
    public static final String[] SHIFTS = {"SANG", "CHIEU", "TOI"};

    private static final Pattern TIME = Pattern.compile("(\\d{1,2})[:h](\\d{2})?\\s*[–-]\\s*(\\d{1,2})[:h](\\d{2})?");
    private static final Pattern DAY_RANGE = Pattern.compile("\\b(T[2-7]|CN)\\s*[–-]\\s*(T[2-7]|CN)\\b");
    private static final Pattern DAY = Pattern.compile("\\b(T[2-7]|CN)\\b");

    private WorkTimeSlots() {}

    public static int fromText(String text) {
        if (text == null || text.isBlank()) return ALL;
        String head = text.split(";")[0];          // phần sau dấu ";" là ghi chú
        String lower = head.toLowerCase(Locale.ROOT);

        // 1. Ngày
        int days = 0;
        Matcher r = DAY_RANGE.matcher(head);
        String rest = head;
        while (r.find()) {
            int a = dayIndex(r.group(1)), b = dayIndex(r.group(2));
            for (int i = a; i <= b; i++) days |= 1 << i;
        }
        rest = DAY_RANGE.matcher(rest).replaceAll(" ");
        Matcher d = DAY.matcher(rest);
        while (d.find()) days |= 1 << dayIndex(d.group(1));
        if (lower.contains("chủ nhật")) days |= 1 << 6;
        if (lower.contains("cuối tuần")) days |= (1 << 5) | (1 << 6);
        if (days == 0) days = 0b1111111;

        // 2. Buổi
        int shifts = 0;
        Matcher t = TIME.matcher(head);
        while (t.find()) {
            int start = minutes(t.group(1), t.group(2));
            int end = minutes(t.group(3), t.group(4));
            if (end <= start) end = 24 * 60;     // ca qua nửa đêm
            if (start < 12 * 60) shifts |= 1;
            if (start < 18 * 60 && end > 12 * 60) shifts |= 2;
            if (end > 18 * 60) shifts |= 4;
        }
        if (shifts == 0) {
            if (lower.contains("sáng")) shifts |= 1;
            if (lower.contains("chiều")) shifts |= 2;
            if (lower.contains("tối")) shifts |= 4;
        }
        if (shifts == 0) shifts = 0b111;

        return combine(days, shifts);
    }

    /** Mặt nạ lọc từ tham số days ("T2,T7,CN") và shifts ("SANG,TOI"); trống = tất cả. */
    public static int filterMask(String daysCsv, String shiftsCsv) {
        int days = 0, shifts = 0;
        if (daysCsv != null) for (String s : daysCsv.split(",")) {
            int i = indexOf(DAYS, s.trim().toUpperCase(Locale.ROOT));
            if (i >= 0) days |= 1 << i;
        }
        if (shiftsCsv != null) for (String s : shiftsCsv.split(",")) {
            int i = indexOf(SHIFTS, s.trim().toUpperCase(Locale.ROOT));
            if (i >= 0) shifts |= 1 << i;
        }
        return combine(days == 0 ? 0b1111111 : days, shifts == 0 ? 0b111 : shifts);
    }

    public static boolean isValidDay(String s) { return indexOf(DAYS, s.trim().toUpperCase(Locale.ROOT)) >= 0; }
    public static boolean isValidShift(String s) { return indexOf(SHIFTS, s.trim().toUpperCase(Locale.ROOT)) >= 0; }

    private static int combine(int days, int shifts) {
        int mask = 0;
        for (int d = 0; d < 7; d++)
            if ((days & (1 << d)) != 0)
                for (int s = 0; s < 3; s++)
                    if ((shifts & (1 << s)) != 0) mask |= 1 << (d * 3 + s);
        return mask;
    }

    private static int dayIndex(String s) { return indexOf(DAYS, s); }

    private static int minutes(String h, String m) {
        return Integer.parseInt(h) * 60 + (m == null ? 0 : Integer.parseInt(m));
    }

    private static int indexOf(String[] arr, String v) {
        for (int i = 0; i < arr.length; i++) if (arr[i].equals(v)) return i;
        return -1;
    }
}
