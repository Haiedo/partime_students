import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { Confirm, StatusBadge, Toast } from '../components/ui';
import { JOB_STATUS, dateText } from '../utils/format';

// MH-12 – Trang Quản trị: quản lý người dùng (PB-15) và kiểm duyệt tin (PB-16).
// Tab mới (ví dụ "Báo cáo tin" ở Sprint 5) chỉ cần thêm vào mảng TABS.
const TABS = [['users', 'Người dùng'], ['jobs', 'Tin đăng']];

const ROLE = { STUDENT: 'Sinh viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' };
const USER_STATUS = { ACTIVE: ['Đang hoạt động', 'open'], LOCKED: ['Đã khóa', 'rejected'] };

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  return (
    <div className="list-page admin">
      <div className="page-head">
        <div>
          <h1>Quản trị</h1>
          <p className="lead">Khóa tài khoản vi phạm và ẩn tin đăng sai quy định. Không xóa dữ liệu, có thể mở lại khi cần.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''}
            onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'jobs' && <JobsTab />}
    </div>
  );
}

// Dùng chung cho 2 tab: tải danh sách theo bộ lọc, hộp thoại xác nhận, thông báo nổi
function useAdminList(url, params) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);
  const load = useCallback(() => {
    client.get(url, { params: JSON.parse(key) })
      .then((res) => { setList(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)));
  }, [url, key]);
  useEffect(() => {
    const t = setTimeout(load, 250);   // gõ ô tìm kiếm xong mới gọi API
    return () => clearTimeout(t);
  }, [load]);
  return { list, setList, error, reload: load };
}

function UsersTab() {
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const { list, setList, error } = useAdminList('/api/admin/users', { role: role || undefined, q: q || undefined });
  const [ask, setAsk] = useState(null);   // người dùng cần xác nhận khóa / mở khóa
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const toggle = async () => {
    const lock = ask.status === 'ACTIVE';
    setBusy(true);
    try {
      const res = await client.patch(`/api/admin/users/${ask.id}/${lock ? 'lock' : 'unlock'}`);
      setList((l) => l.map((u) => (u.id === res.data.id ? res.data : u)));
      setToast({ text: lock ? `Đã khóa tài khoản ${ask.email}` : `Đã mở khóa tài khoản ${ask.email}`, type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  return (
    <>
      <div className="admin-filter">
        <input type="search" placeholder="Tìm theo email hoặc họ tên" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm người dùng" />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Lọc vai trò">
          <option value="">Mọi vai trò</option>
          {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {list && <span className="admin-count">{list.length} tài khoản</span>}
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!list && !error && <div className="card muted-box">Đang tải danh sách người dùng...</div>}
      {list && list.length === 0 && <div className="card muted-box"><b>Không có tài khoản nào khớp bộ lọc</b></div>}

      {list && list.length > 0 && (
        <div className="card admin-table">
          <table>
            <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.fullName}</b><small>{u.email}</small></td>
                  <td>{ROLE[u.role]}</td>
                  <td>{dateText(u.createdAt)}</td>
                  <td><StatusBadge map={USER_STATUS} value={u.status} /></td>
                  <td className="act">
                    {u.role !== 'ADMIN' && (
                      <button type="button" className={`btn small ${u.status === 'ACTIVE' ? 'ghost' : 'primary'}`} onClick={() => setAsk(u)}>
                        {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ask && (
        <Confirm
          title={ask.status === 'ACTIVE' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
          text={ask.status === 'ACTIVE'
            ? `${ask.fullName} (${ask.email}) sẽ không đăng nhập được nữa cho tới khi được mở khóa. Dữ liệu của tài khoản vẫn được giữ.`
            : `${ask.fullName} (${ask.email}) sẽ đăng nhập lại được bình thường.`}
          okText={ask.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
          danger={ask.status === 'ACTIVE'}
          busy={busy}
          onOk={toggle}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </>
  );
}

const JOB_FILTERS = [['', 'Tất cả'], ['false', 'Đang hiển thị'], ['true', 'Đã ẩn']];

function JobsTab() {
  const [hidden, setHidden] = useState('');
  const [q, setQ] = useState('');
  const { list, setList, error } = useAdminList('/api/admin/jobs', { hidden: hidden || undefined, q: q || undefined });
  const [ask, setAsk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const toggle = async () => {
    const hide = !ask.hidden;
    setBusy(true);
    try {
      const res = await client.patch(`/api/admin/jobs/${ask.id}/${hide ? 'hide' : 'unhide'}`);
      setList((l) => l.map((j) => (j.id === res.data.id ? res.data : j)).filter((j) => hidden === '' || String(j.hidden) === hidden));
      setToast({ text: hide ? `Đã ẩn tin "${ask.title}"` : `Đã hiện lại tin "${ask.title}"`, type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  return (
    <>
      <div className="admin-filter">
        <input type="search" placeholder="Tìm theo tiêu đề tin hoặc tên công ty" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm tin" />
        <div className="tabs small-tabs">
          {JOB_FILTERS.map(([v, label]) => (
            <button key={v} type="button" className={hidden === v ? 'on' : ''} onClick={() => setHidden(v)}>{label}</button>
          ))}
        </div>
        {list && <span className="admin-count">{list.length} tin</span>}
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!list && !error && <div className="card muted-box">Đang tải danh sách tin...</div>}
      {list && list.length === 0 && <div className="card muted-box"><b>Không có tin nào khớp bộ lọc</b></div>}

      {list && list.length > 0 && (
        <div className="card admin-table">
          <table>
            <thead><tr><th>Tin tuyển dụng</th><th>Khu vực</th><th>Ngày đăng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.id} className={j.hidden ? 'dim' : ''}>
                  <td>
                    {j.hidden ? <b>{j.title}</b> : <Link to={`/jobs/${j.id}`} target="_blank"><b>{j.title}</b></Link>}
                    <small>{j.companyName} · {j.category}</small>
                  </td>
                  <td>{j.location}</td>
                  <td>{dateText(j.createdAt)}</td>
                  <td>{j.hidden ? <span className="badge rejected">Đã ẩn</span> : <StatusBadge map={JOB_STATUS} value={j.status} />}</td>
                  <td className="act">
                    <button type="button" className={`btn small ${j.hidden ? 'primary' : 'ghost'}`} onClick={() => setAsk(j)}>
                      {j.hidden ? 'Hiện lại' : 'Ẩn tin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ask && (
        <Confirm
          title={ask.hidden ? 'Hiện lại tin?' : 'Ẩn tin vi phạm?'}
          text={ask.hidden
            ? `Tin "${ask.title}" sẽ hiện lại trong kết quả tìm kiếm.`
            : `Tin "${ask.title}" của ${ask.companyName} sẽ biến mất khỏi tìm kiếm và trang chi tiết, sinh viên không ứng tuyển được. Nhà tuyển dụng sẽ nhận thông báo. Tin không bị xóa.`}
          okText={ask.hidden ? 'Hiện lại' : 'Ẩn tin'}
          danger={!ask.hidden}
          busy={busy}
          onOk={toggle}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </>
  );
}
