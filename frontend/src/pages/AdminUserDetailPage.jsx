import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client, { API_URL, errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import { Confirm, StatusBadge, Toast } from '../components/ui';
import { APP_STATUS, JOB_STATUS, dateText, salaryText } from '../utils/format';

const ROLE = { STUDENT: 'Sinh viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' };
const USER_STATUS = { ACTIVE: ['Đang hoạt động', 'open'], LOCKED: ['Đã khóa', 'rejected'] };

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const load = useCallback(() => {
    client.get(`/api/admin/users/${id}`)
      .then((res) => { setUser(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleLock = async () => {
    const lock = user.status === 'ACTIVE';
    setBusy(true);
    try {
      await client.patch(`/api/admin/users/${user.id}/${lock ? 'lock' : 'unlock'}`);
      setToast({
        text: lock ? `Đã khóa tài khoản ${user.email}` : `Đã mở khóa tài khoản ${user.email}`,
        type: 'success',
      });
      load();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(false);
    }
  };

  if (error) {
    return (
      <div className="card muted-box">
        <b>{error}</b>
        <p><Link to="/admin">Quay lại trang Quản trị</Link></p>
      </div>
    );
  }
  if (!user) return <div className="card muted-box">Đang tải thông tin tài khoản...</div>;

  const isLocked = user.status === 'LOCKED';
  const skills = (user.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="detail">
      <div className="crumb">
        <Link to="/admin">Quản trị</Link> / <Link to="/admin">Người dùng</Link> / {user.fullName}
      </div>

      <section className="card detail-head">
        <div className="job-logo big">{initials(user.fullName)}</div>
        <div className="detail-title">
          <h1>{user.fullName}</h1>
          <div className="job-company">{user.email}</div>
          <div className="job-meta">
            <StatusBadge map={USER_STATUS} value={user.status} />
            <span className="chip">{ROLE[user.role] || user.role}</span>
            <span className="when">Tham gia ngày {dateText(user.createdAt)}</span>
          </div>
        </div>
        <div className="detail-action admin-detail-actions">
          {user.role !== 'ADMIN' && (
            <button
              type="button"
              className={`btn full ${isLocked ? 'primary' : 'danger'}`}
              onClick={() => setAsk(true)}
            >
              {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </button>
          )}
          <Link to="/admin" className="btn ghost full">Quay lại danh sách</Link>
        </div>
      </section>

      {user.role === 'STUDENT' && (
        <>
          <section className="card">
            <h2>Thông tin hồ sơ sinh viên</h2>
            <div className="facts">
              <div><span>Trường</span><b>{user.school || 'Chưa cập nhật'}</b></div>
              <div><span>Ngành học</span><b>{user.major || 'Chưa cập nhật'}</b></div>
              <div><span>Số điện thoại</span><b>{user.phone || 'Chưa cập nhật'}</b></div>
              <div>
                <span>CV đính kèm</span>
                <b>
                  {user.cvUrl
                    ? <a href={API_URL + user.cvUrl} target="_blank" rel="noreferrer">Xem file CV</a>
                    : 'Chưa tải lên'}
                </b>
              </div>
            </div>
            {skills.length > 0 && (
              <div className="admin-sub-block">
                <h3>Kỹ năng</h3>
                <div className="chips">{skills.map((s) => <em key={s}>{s}</em>)}</div>
              </div>
            )}
            <div className="admin-sub-block">
              <h3>Giới thiệu bản thân</h3>
              <p className="desc">{user.bio || 'Chưa có giới thiệu bản thân.'}</p>
            </div>
          </section>

          <section className="card">
            <h2>Lịch sử ứng tuyển ({user.applications.length} đơn)</h2>
            {user.applications.length === 0 ? (
              <p className="hint">Sinh viên này chưa ứng tuyển tin nào.</p>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr><th>Tin tuyển dụng</th><th>Mức lương</th><th>Ngày nộp</th><th>Trạng thái đơn</th></tr>
                  </thead>
                  <tbody>
                    {user.applications.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link to={`/admin/jobs/${a.jobId}`}><b>{a.jobTitle}</b></Link>
                          <small>{a.companyName} · {a.location}</small>
                        </td>
                        <td>{salaryText(a)}</td>
                        <td>{dateText(a.appliedAt)}</td>
                        <td><StatusBadge map={APP_STATUS} value={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {user.role === 'EMPLOYER' && (
        <>
          <section className="card">
            <h2>Thông tin nhà tuyển dụng</h2>
            <div className="facts">
              <div><span>Tên đơn vị / công ty</span><b>{user.companyName || 'Chưa cập nhật'}</b></div>
              <div><span>Địa chỉ</span><b>{user.address || 'Chưa cập nhật'}</b></div>
              <div><span>Email liên hệ</span><b>{user.contactEmail || 'Chưa cập nhật'}</b></div>
              <div><span>Số điện thoại liên hệ</span><b>{user.contactPhone || 'Chưa cập nhật'}</b></div>
            </div>
            <div className="admin-sub-block">
              <h3>Mô tả đơn vị</h3>
              <p className="desc">{user.companyDescription || 'Chưa có mô tả.'}</p>
            </div>
          </section>

          <section className="card">
            <h2>Các tin đã đăng ({user.jobs.length} tin)</h2>
            {user.jobs.length === 0 ? (
              <p className="hint">Nhà tuyển dụng này chưa đăng tin nào.</p>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr><th>Tin tuyển dụng</th><th>Khu vực</th><th>Ngày đăng</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody>
                    {user.jobs.map((j) => (
                      <tr key={j.id} className={j.hidden ? 'dim' : ''}>
                        <td>
                          <Link to={`/admin/jobs/${j.id}`}><b>{j.title}</b></Link>
                          <small>{j.category}</small>
                        </td>
                        <td>{j.location}</td>
                        <td>{dateText(j.createdAt)}</td>
                        <td>{j.hidden ? <span className="badge rejected">Đã ẩn</span> : <StatusBadge map={JOB_STATUS} value={j.status} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {ask && (
        <Confirm
          title={isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
          text={isLocked
            ? `${user.fullName} (${user.email}) sẽ đăng nhập lại được bình thường.`
            : `${user.fullName} (${user.email}) sẽ không đăng nhập được nữa cho tới khi được mở khóa. Dữ liệu của tài khoản vẫn được giữ.`}
          okText={isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
          danger={!isLocked}
          busy={busy}
          onOk={toggleLock}
          onClose={() => setAsk(false)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}