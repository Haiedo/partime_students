// Độ mạnh mật khẩu 0–3, dùng ở Đăng ký và Đặt lại mật khẩu
export function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s += 1;
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) s += 1;
  return s;
}

export const STRENGTH_TEXT = ['Quá ngắn', 'Tạm được', 'Khá', 'Mạnh'];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
