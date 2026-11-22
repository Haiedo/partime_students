import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';

// MH-11 – Chuông thông báo trên thanh đầu trang (PB-14): số chưa đọc, danh sách 30 thông báo mới nhất.
// Tự tải lại mỗi 30 giây và mỗi lần chuyển trang.
export default function NotificationBell() {
  const [data, setData] = useState({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const load = useCallback(() => {
    client.get('/api/notifications/me').then((res) => setData(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, pathname]);

  // Bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      try { await client.patch(`/api/notifications/${n.id}/read`); } catch { /* vẫn chuyển trang */ }
      load();
    }
    const target = (n.type === 'JOB_PENDING_APPROVAL' && n.link === '/admin')
      ? '/admin?tab=jobs&filter=PENDING'
      : n.link;
    if (target) navigate(target, { state: { fromNotif: Date.now() } });
  };

  const readAll = async () => {
    try { await client.patch('/api/notifications/me/read-all'); } finally { load(); }
  };

  return (
    <div className="bell" ref={box}>
      <button
        type="button"
        className={`bell-btn ${data.unreadCount ? 'has' : ''}`}
        aria-label="Thông báo"
        title="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {data.unreadCount > 0 && <b>{data.unreadCount > 99 ? '99+' : data.unreadCount}</b>}
      </button>
      {open && (
        <div className="bell-panel" role="menu">
          <div className="bell-head">
            <b>Thông báo</b>
            {data.unreadCount > 0 && <button type="button" onClick={readAll}>Đánh dấu đã đọc hết</button>}
          </div>
          {data.items.length === 0 && <p className="bell-empty">Chưa có thông báo nào</p>}
          <ul>
            {data.items.map((n) => (
              <li key={n.id}>
                <button type="button" role="menuitem" className={n.read ? '' : 'unread'} onClick={() => openItem(n)}>
                  <span>{n.message}</span>
                  <small>{timeAgo(n.createdAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}
