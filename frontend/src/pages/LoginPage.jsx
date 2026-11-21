import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { homeOf, useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { AuthAside, PasswordInput } from '../components/ui';
import { SocialLogin } from '../components/SocialLogin';
import loginArt from '../assets/dang-nhap.jpg';

// MH-01 – Đăng nhập (B6-08); thêm Tiếp tục với Google (PB-17) và Quên mật khẩu (PB-19)
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Đang ở trang khác thì bị chuyển sang đăng nhập -> quay lại trang đó; còn lại vào trang đầu của vai trò
      navigate(location.state?.from || homeOf(user.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthAside image={loginArt} title="Việc làm thêm vừa sức, khớp với lịch học của bạn"
        text="Hàng trăm ca làm part-time gần trường, đánh giá minh bạch từ chính sinh viên đã làm." />

      <div className="auth-box">
        <h1>Chào mừng trở lại</h1>
        <p className="lead">Đăng nhập để tiếp tục tìm việc hoặc quản lý tin tuyển dụng.</p>
        {location.state?.registered && <p className="alert success">Đăng ký thành công, mời bạn đăng nhập</p>}
        {location.state?.reset && <p className="alert success">Đã đổi mật khẩu, mời bạn đăng nhập bằng mật khẩu mới</p>}
        <form onSubmit={onSubmit} noValidate>
          <label>Email
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="vd: sv1@gr7.vn" />
          </label>
          <label>
            <span className="label-row">Mật khẩu <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link></span>
            <PasswordInput name="password" value={form.password} onChange={onChange} placeholder="Nhập mật khẩu" />
          </label>
          {error && <p className="alert error">{error}</p>}
          <button className="btn primary full big" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <SocialLogin onError={setError} from={location.state?.from} />
        <p className="switch">Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link></p>
      </div>
    </div>
  );
}
