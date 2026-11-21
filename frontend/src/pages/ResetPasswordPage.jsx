import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { AuthAside, PasswordInput } from '../components/ui';
import { STRENGTH_TEXT, strength } from '../utils/password';
import loginArt from '../assets/dang-nhap.jpg';

// MH-14 – Quên mật khẩu, bước 2: mở từ đường dẫn trong email (/reset-password?token=...) (PB-19)
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setMessage('');
    const e = {};
    if (form.password.length < 8) e.password = 'Mật khẩu phải từ 8 ký tự';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await client.post('/api/auth/reset-password', { token, newPassword: form.password });
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (err) {
      const f = fieldErrors(err);
      setErrors({ password: f.newPassword });
      setMessage(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const st = strength(form.password);

  return (
    <div className="auth-wrap">
      <AuthAside image={loginArt} title="Đặt mật khẩu mới"
        text="Chọn mật khẩu từ 8 ký tự, có cả chữ và số. Sau khi đổi, đường dẫn trong email không dùng lại được nữa." />

      <div className="auth-box">
        <h1>Đặt lại mật khẩu</h1>
        {!token ? (
          <>
            <p className="alert error">Đường dẫn không đầy đủ. Vui lòng mở lại đường dẫn trong email hoặc gửi yêu cầu mới.</p>
            <Link to="/forgot-password" className="btn ghost full">Gửi lại email đặt lại mật khẩu</Link>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <label>Mật khẩu mới
              <PasswordInput name="password" value={form.password} onChange={onChange} placeholder="Từ 8 ký tự" />
              {form.password && <span className={`meter m${st}`}><i /><i /><i /><em>{STRENGTH_TEXT[st]}</em></span>}
              {errors.password && <span className="error">{errors.password}</span>}
            </label>
            <label>Nhập lại mật khẩu mới
              <PasswordInput name="confirm" value={form.confirm} onChange={onChange} />
              {errors.confirm && <span className="error">{errors.confirm}</span>}
            </label>
            {message && (
              <p className="alert error">{message} {message.includes('hết hạn') && <Link to="/forgot-password">Gửi yêu cầu mới</Link>}</p>
            )}
            <button className="btn primary full big" disabled={loading}>{loading ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
          </form>
        )}
        <p className="switch"><Link to="/login">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}
