// Danh sách 34 tỉnh/thành (theo Nghị quyết 202/2025/QH15, hiệu lực từ 01/7/2025) và khu vực để chọn địa chỉ.
// Giá trị lưu xuống backend có dạng "<khu vực>, <tỉnh/thành>", ví dụ "Bình Thạnh, TP.HCM";
// chọn cả tỉnh/thành thì lưu "TP.HCM". Bộ lọc địa điểm ở trang chủ tìm theo chuỗi này.
// Khu vực dùng tên quen thuộc (quận/huyện, thành phố cũ, tỉnh cũ trước sáp nhập) để sinh viên dễ tìm;
// không bắt buộc chọn khu vực.

export const REMOTE = 'Làm từ xa';

// 6 thành phố trực thuộc trung ương
const CITIES = [
  {
    name: 'TP.HCM',
    areas: ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
      'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Thủ Đức',
      'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Cần Giờ',
      'Thủ Dầu Một', 'Dĩ An', 'Thuận An', 'Bến Cát', 'Tân Uyên', 'Vũng Tàu', 'Bà Rịa', 'Phú Mỹ'],
  },
  {
    name: 'Hà Nội',
    areas: ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai',
      'Long Biên', 'Tây Hồ', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông', 'Gia Lâm', 'Đông Anh', 'Thanh Trì', 'Sơn Tây'],
  },
  {
    name: 'Đà Nẵng',
    areas: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang',
      'Hội An', 'Tam Kỳ', 'Điện Bàn'],
  },
  {
    name: 'Hải Phòng',
    areas: ['Hồng Bàng', 'Lê Chân', 'Ngô Quyền', 'Hải An', 'Kiến An', 'Dương Kinh', 'Đồ Sơn', 'Thủy Nguyên',
      'An Dương', 'Hải Dương', 'Chí Linh', 'Kinh Môn'],
  },
  { name: 'Cần Thơ', areas: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt', 'Sóc Trăng', 'Vị Thanh', 'Ngã Bảy'] },
  { name: 'Huế', areas: ['Thuận Hóa', 'Phú Xuân', 'Hương Thủy', 'Hương Trà'] },
];

// 28 tỉnh, xếp theo bảng chữ cái
const PROVINCES = [
  { name: 'An Giang', areas: ['Long Xuyên', 'Châu Đốc', 'Rạch Giá', 'Phú Quốc'] },
  { name: 'Bắc Ninh', areas: ['Bắc Ninh', 'Từ Sơn', 'Bắc Giang'] },
  { name: 'Cà Mau', areas: ['Cà Mau', 'Bạc Liêu'] },
  { name: 'Cao Bằng', areas: ['Cao Bằng'] },
  { name: 'Đắk Lắk', areas: ['Buôn Ma Thuột', 'Tuy Hòa'] },
  { name: 'Điện Biên', areas: ['Điện Biên Phủ'] },
  { name: 'Đồng Nai', areas: ['Biên Hòa', 'Long Khánh', 'Long Thành', 'Nhơn Trạch', 'Trảng Bom', 'Đồng Xoài'] },
  { name: 'Đồng Tháp', areas: ['Cao Lãnh', 'Sa Đéc', 'Mỹ Tho'] },
  { name: 'Gia Lai', areas: ['Pleiku', 'An Khê', 'Quy Nhơn'] },
  { name: 'Hà Tĩnh', areas: ['Hà Tĩnh', 'Hồng Lĩnh'] },
  { name: 'Hưng Yên', areas: ['Hưng Yên', 'Mỹ Hào', 'Thái Bình'] },
  { name: 'Khánh Hòa', areas: ['Nha Trang', 'Cam Ranh', 'Phan Rang – Tháp Chàm'] },
  { name: 'Lai Châu', areas: ['Lai Châu'] },
  { name: 'Lâm Đồng', areas: ['Đà Lạt', 'Bảo Lộc', 'Phan Thiết', 'Gia Nghĩa'] },
  { name: 'Lạng Sơn', areas: ['Lạng Sơn'] },
  { name: 'Lào Cai', areas: ['Lào Cai', 'Sa Pa', 'Yên Bái'] },
  { name: 'Nghệ An', areas: ['Vinh', 'Cửa Lò'] },
  { name: 'Ninh Bình', areas: ['Ninh Bình', 'Tam Điệp', 'Nam Định', 'Phủ Lý'] },
  { name: 'Phú Thọ', areas: ['Việt Trì', 'Vĩnh Yên', 'Phúc Yên', 'Hòa Bình'] },
  { name: 'Quảng Ngãi', areas: ['Quảng Ngãi', 'Kon Tum'] },
  { name: 'Quảng Ninh', areas: ['Hạ Long', 'Cẩm Phả', 'Uông Bí', 'Móng Cái'] },
  { name: 'Quảng Trị', areas: ['Đông Hà', 'Đồng Hới'] },
  { name: 'Sơn La', areas: ['Sơn La', 'Mộc Châu'] },
  { name: 'Tây Ninh', areas: ['Tây Ninh', 'Tân An'] },
  { name: 'Thái Nguyên', areas: ['Thái Nguyên', 'Sông Công', 'Phổ Yên', 'Bắc Kạn'] },
  { name: 'Thanh Hóa', areas: ['Thanh Hóa', 'Sầm Sơn'] },
  { name: 'Tuyên Quang', areas: ['Tuyên Quang', 'Hà Giang'] },
  { name: 'Vĩnh Long', areas: ['Vĩnh Long', 'Bến Tre', 'Trà Vinh'] },
];

export const AREA_GROUPS = [
  { label: 'Thành phố trực thuộc trung ương', items: CITIES },
  { label: 'Tỉnh', items: PROVINCES },
];

export const AREAS = [...CITIES, ...PROVINCES];

// Ghép giá trị lưu xuống backend
export function joinArea(province, area) {
  if (province === REMOTE) return REMOTE;
  if (!province) return '';
  return area ? `${area}, ${province}` : province;
}

// Tách chuỗi đã lưu thành { province, area }; chuỗi cũ không khớp danh sách thì trả về rỗng để chọn lại
export function splitArea(value = '') {
  const v = value.trim();
  if (!v) return { province: '', area: '' };
  if (v === REMOTE) return { province: REMOTE, area: '' };
  const parts = v.split(',').map((x) => x.trim());
  const province = parts[parts.length - 1];
  const p = AREAS.find((x) => x.name === province);
  if (!p) return { province: '', area: '' };
  if (parts.length === 1) return { province, area: '' };
  const area = parts[parts.length - 2];
  return p.areas.includes(area) ? { province, area } : { province, area: '' };
}

// Địa chỉ đầy đủ của nhà tuyển dụng: "<số nhà, đường>, <khu vực>, <tỉnh/thành>"
export function splitAddress(value = '') {
  const parts = value.split(',').map((x) => x.trim()).filter(Boolean);
  for (let n = Math.min(2, parts.length); n >= 1; n -= 1) {
    const tail = parts.slice(parts.length - n).join(', ');
    const sa = splitArea(tail);
    if (sa.province && (n === 1 || sa.area)) return { street: parts.slice(0, parts.length - n).join(', '), ...sa };
  }
  return { street: '', province: '', area: '' };
}
