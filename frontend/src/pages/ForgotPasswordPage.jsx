import { useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { AuthAside } from '../components/ui';
import { EMAIL_RE } from '../utils/password';
import loginArt from '../assets/dang-nhap.svg';

// MH-14 – Quên mật khẩu, bước 1: nhập email để nhận đường dẫn đặt lại (PB-19)
// Email có đăng ký hay không, màn hình đều hiện cùng một câu để không lộ email đã có tài khoản.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('Email không đúng định dạng');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthAside image={loginArt} title="Quên mật khẩu không sao cả"
        text="Nhập email đã đăng ký, chúng tôi gửi đường dẫn đặt mật khẩu mới. Đường dẫn dùng được 15 phút và chỉ một lần." />

      <div className="auth-box">
        <h1>Quên mật khẩu</h1>
        {sent ? (
          <>
            <p className="alert success">{sent}.</p>
            <ol className="next-steps">
              <li>Mở hộp thư <b>{email}</b>, tìm email từ PartTimeSV (xem cả mục Thư rác).</li>
              <li>Bấm đường dẫn trong email trong vòng 15 phút.</li>
              <li>Đặt mật khẩu mới rồi đăng nhập lại.</li>
            </ol>
            <button type="button" className="btn ghost full" onClick={() => setSent('')}>Gửi lại email khác</button>
          </>
        ) : (
          <>
            <p className="lead">Nhập email bạn dùng để đăng nhập PartTimeSV.</p>
            <form onSubmit={onSubmit} noValidate>
              <label>Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vd: sv1@gr7.vn"
                  className={error ? 'invalid' : ''} />
              </label>
              {error && <p className="alert error">{error}</p>}
              <button className="btn primary full big" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi đường dẫn đặt lại'}</button>
            </form>
          </>
        )}
        <p className="switch">Nhớ ra mật khẩu? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}
