import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { homeOf, useAuth } from '../auth/AuthContext';
import { loadScript } from '../utils/loadScript';

// Client ID loại "Web application" ở Google Cloud Console, đặt trong frontend/.env: VITE_GOOGLE_CLIENT_ID=...
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Đăng nhập bằng mạng xã hội (PB-17): 200 -> vào trang theo vai trò; 202 -> MH-13 Chọn vai trò
export function SocialLogin({ onError, from }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const send = async (url, body) => {
    onError('');
    setBusy(true);
    try {
      const res = await client.post(url, body);
      if (res.status === 202) {
        navigate('/social/complete', { state: { signup: res.data, from } });
      } else {
        const user = signIn(res.data);
        navigate(from || homeOf(user.role), { replace: true });
      }
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="social">
      <GoogleButton busy={busy} onToken={(idToken) => send('/api/auth/google', { idToken })} />
      <div className="or-line"><span>hoặc dùng email</span></div>
    </div>
  );
}

// Nút "Tiếp tục với Google": nút của trang, phủ lên trên là nút trong suốt của Google Identity Services
// (Google chỉ cấp ID token qua nút của họ) nên giao diện vẫn đồng bộ, không có biểu tượng.
function GoogleButton({ busy, onToken }) {
  const box = useRef(null);
  const handler = useRef(onToken);
  const [ready, setReady] = useState(false);
  handler.current = onToken;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let alive = true;
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        const gid = window.google?.accounts?.id;
        if (!alive || !gid || !box.current) return;
        gid.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => handler.current(r.credential) });
        gid.renderButton(box.current, {
          type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
          width: Math.min(400, box.current.offsetWidth || 320),
        });
        setReady(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="social-btn">
      <button type="button" className="btn ghost full" tabIndex={-1} disabled={!GOOGLE_CLIENT_ID || busy}
        title={GOOGLE_CLIENT_ID ? '' : 'Chưa cấu hình VITE_GOOGLE_CLIENT_ID'}>
        {busy ? 'Đang xử lý...' : 'Tiếp tục với Google'}
      </button>
      {GOOGLE_CLIENT_ID && <div className={`social-overlay ${ready ? 'ready' : ''}`} ref={box} />}
    </div>
  );
}
