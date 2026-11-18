import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { homeOf, useAuth } from '../auth/AuthContext';
import { AuthAside } from '../components/ui';
import { EMAIL_RE } from '../utils/password';
import loginArt from '../assets/dang-nhap.svg';

const ROLES = [
  ['STUDENT', 'Sinh viên', 'Tìm việc part-time, ứng tuyển, theo dõi đơn'],
  ['EMPLOYER', 'Nhà tuyển dụng', 'Đăng tin, xem hồ sơ, duyệt ứng viên'],
];

// MH-13 – Chọn vai trò: lần đầu đăng nhập bằng Google / Facebook (PB-17, PB-18)
// Nhận signupToken từ trang Đăng nhập; signupToken hết hạn sau 10 phút.
export default function RoleSelectPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const signup = state?.signup;
  const [form, setForm] = useState({ role: '', fullName: signup?.fullName || '', email: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Vào thẳng đường dẫn này mà không qua bước đăng nhập Google / Facebook
  if (!signup) return <Navigate to="/login" replace />;
  const askEmail = !signup.email;   // Facebook không trả email

  const set = (name, value) => {
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setMessage('');
    const e = {};
    if (!form.role) e.role = 'Vui lòng chọn bạn là sinh viên hay nhà tuyển dụng';
    if (!form.fullName.trim()) e.fullName = 'Họ tên không được để trống';
    if (askEmail && !EMAIL_RE.test(form.email)) e.email = 'Email không đúng định dạng';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const res = await client.post('/api/auth/social/complete', {
        signupToken: signup.signupToken, role: form.role, fullName: form.fullName.trim(),
        email: askEmail ? form.email.trim() : null,
      });
      const user = signIn(res.data);
      navigate(state?.from || homeOf(user.role), { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthAside image={loginArt} title="Chỉ còn một bước nữa"
        text="Cho chúng tôi biết bạn dùng PartTimeSV để tìm việc hay để tuyển người. Vai trò không đổi được sau khi tạo tài khoản." />

      <div className="auth-box">
        <h1>Bạn là ai?</h1>
        <p className="lead">
          {askEmail ? 'Tài khoản mạng xã hội của bạn không có email, vui lòng nhập email để nhận thông báo.'
            : <>Tạo tài khoản cho <b>{signup.email}</b></>}
        </p>
        <form onSubmit={onSubmit} noValidate>
          <div className="role-switch big">
            {ROLES.map(([value, label, sub]) => (
              <button type="button" key={value} className={form.role === value ? 'role on' : 'role'}
                onClick={() => set('role', value)}>
                <b>{label}</b><span>{sub}</span>
              </button>
            ))}
          </div>
          {errors.role && <span className="error">{errors.role}</span>}
          <label>{form.role === 'EMPLOYER' ? 'Họ tên người liên hệ' : 'Họ tên'}
            <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
              className={errors.fullName ? 'invalid' : ''} placeholder="vd: Nguyễn Văn An" />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
          </label>
          {askEmail && (
            <label>Email
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                className={errors.email ? 'invalid' : ''} placeholder="vd: an.nguyen@gmail.com" />
              {errors.email && <span className="error">{errors.email}</span>}
            </label>
          )}
          {message && <p className="alert error">{message}</p>}
          <button className="btn primary full big" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Hoàn tất'}</button>
        </form>
        <p className="switch">Không phải bạn? <Link to="/login">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}
