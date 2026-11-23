// Danh sách kỹ năng sinh viên được chọn trong hồ sơ (không nhập tay).
// Phải giống danh sách trong backend: service/SkillCatalog.java (backend từ chối kỹ năng ngoài danh sách).
// Giá trị lưu xuống backend là chuỗi các kỹ năng cách nhau bằng ", ", ví dụ "Giao tiếp, Làm việc nhóm".

export const MAX_SKILLS = 10;

export const SKILL_GROUPS = [
  {
    name: 'Kỹ năng mềm',
    items: ['Giao tiếp', 'Làm việc nhóm', 'Thuyết trình', 'Giải quyết vấn đề', 'Quản lý thời gian',
      'Chịu được áp lực', 'Chăm sóc khách hàng', 'Bán hàng', 'Tư vấn', 'Sáng tạo'],
  },
  {
    name: 'Tin học và ngoại ngữ',
    items: ['Tin học văn phòng', 'Excel', 'Nhập liệu', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'],
  },
  {
    name: 'Chuyên môn',
    items: ['Pha chế', 'Phục vụ', 'Thu ngân', 'Gia sư', 'Thiết kế đồ họa', 'Chụp ảnh', 'Viết nội dung',
      'Quản lý mạng xã hội', 'Lập trình', 'Lái xe máy'],
  },
];

const ALL = SKILL_GROUPS.flatMap((g) => g.items);
const BY_KEY = new Map(ALL.map((s) => [s.toLowerCase(), s]));

/** Tách chuỗi kỹ năng đã lưu; trả về kỹ năng có trong danh sách (đúng chữ hoa thường) và kỹ năng cũ không còn trong danh sách. */
export function parseSkills(text) {
  const known = [];
  const unknown = [];
  String(text || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
    const k = BY_KEY.get(s.toLowerCase());
    if (k) { if (!known.includes(k)) known.push(k); } else unknown.push(s);
  });
  return { known, unknown };
}

/** Ghép danh sách đã chọn thành chuỗi lưu xuống backend, theo thứ tự trong SKILL_GROUPS. */
export function joinSkills(list) {
  return ALL.filter((s) => list.includes(s)).join(', ');
}
