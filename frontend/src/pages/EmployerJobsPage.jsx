import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { Confirm, StatusBadge, Toast } from '../components/ui';
import { JOB_STATUS, dateText, salaryText } from '../utils/format';

const TABS = [['OPEN', 'Đang tuyển'], ['CLOSED', 'Ngừng tuyển'], ['ALL', 'Tất cả']];

// PB-12: mỗi trạng thái chỉ có một bước tiếp theo hợp lệ
const NEXT = {
  OPEN: { status: 'FILLED', label: 'Đã đủ người', title: 'Chuyển sang Đã đủ người?', text: 'sẽ ngừng nhận đơn mới. Các sinh viên đã được nhận sẽ nhận thông báo.', done: 'Đã chuyển tin sang Đã đủ người' },
  FILLED: { status: 'COMPLETED', label: 'Hoàn thành', title: 'Xác nhận công việc đã hoàn thành?', text: 'sẽ chuyển sang Hoàn thành. Sau đó bạn và sinh viên có thể đánh giá lẫn nhau.', done: 'Công việc đã hoàn thành, bạn có thể đánh giá sinh viên ở trang Xem ứng viên' },
};

// MH-07 – Quản lý tin của tôi (PB-05, PB-06, PB-12): đóng / xóa / đổi trạng thái tin phải xác nhận qua hộp thoại
export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState('OPEN');
  const [ask, setAsk] = useState(null); // { type: 'close' | 'delete' | 'status', job }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const load = () => client.get('/api/employers/me/jobs')
    .then((res) => setJobs(res.data))
    .catch((err) => setToast({ text: errorMessage(err), type: 'error' }));
  useEffect(() => { load(); }, []);

  const doAction = async () => {
    const { type, job } = ask;
    setBusy(true);
    try {
      if (type === 'close') await client.patch(`/api/jobs/${job.id}/close`);
      else if (type === 'status') await client.patch(`/api/jobs/${job.id}/status`, { status: NEXT[job.status].status });
      else await client.delete(`/api/jobs/${job.id}`);
      const done = { close: 'Đã đóng tin, sinh viên không ứng tuyển được nữa', delete: 'Đã xóa tin', status: NEXT[job.status]?.done };
      setToast({ text: done[type], type: 'success' });
      await load();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  const inTab = (j) => tab === 'ALL' || (tab === 'OPEN' ? j.status === 'OPEN' : j.status !== 'OPEN');
  const shown = (jobs || []).filter(inTab);
  const total = (jobs || []).reduce((n, j) => n + j.applicationCount, 0);
  const pending = (jobs || []).reduce((n, j) => n + j.pendingCount, 0);

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Tin tuyển dụng của tôi</h1>
          <p className="lead">Đăng tin, theo dõi số đơn và duyệt ứng viên cho từng tin.</p>
        </div>
        <Link to="/employer/jobs/new" className="btn primary big">Đăng tin mới</Link>
      </div>

      <div className="stats">
        <div><b>{(jobs || []).filter((j) => j.status === 'OPEN').length}</b><span>Tin đang tuyển</span></div>
        <div><b>{total}</b><span>Tổng số đơn</span></div>
        <div className={pending ? 'hot' : ''}><b>{pending}</b><span>Đơn chờ duyệt</span></div>
      </div>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}<em>{(jobs || []).filter((j) => k === 'ALL' || (k === 'OPEN' ? j.status === 'OPEN' : j.status !== 'OPEN')).length}</em>
          </button>
        ))}
      </div>

      {!jobs && <div className="card muted-box">Đang tải danh sách tin...</div>}
      {jobs && shown.length === 0 && (
        <div className="card muted-box">
          <b>{jobs.length === 0 ? 'Bạn chưa đăng tin nào' : 'Không có tin ở mục này'}</b>
          <p>Bấm Đăng tin mới để bắt đầu nhận hồ sơ sinh viên.</p>
        </div>
      )}

      <div className="rows">
        {shown.map((j) => (
          <article key={j.id} className="row-card emp-job">
            <div className="row-main">
              <Link to={`/jobs/${j.id}`} className="job-title">{j.title}</Link>
              <div className="job-meta">
                <StatusBadge map={JOB_STATUS} value={j.status} />
                {j.hidden && <span className="badge closed">Bị quản trị viên ẩn</span>}
                <span className="salary">{salaryText(j)}</span>
                <span className="chip">{j.location}</span>
                <span className="chip">{j.category}</span>
                <span className="chip">Cần {j.slots} người</span>
                <span className="when">Đăng ngày {dateText(j.createdAt)}</span>
              </div>
            </div>
            <div className="emp-count">
              <b>{j.applicationCount}</b><span>đơn</span>
              {j.pendingCount > 0 && <em>{j.pendingCount} chờ duyệt</em>}
            </div>
            <div className="emp-actions">
              <Link to={`/employer/jobs/${j.id}/applicants`} className="btn primary small">Xem ứng viên</Link>
              {j.status === 'OPEN' && <Link to={`/employer/jobs/${j.id}/edit`} className="btn ghost small">Sửa</Link>}
              {NEXT[j.status] && !j.hidden && j.applicationCount > 0 && (
                <button type="button" className="btn accent small" onClick={() => setAsk({ type: 'status', job: j })}>{NEXT[j.status].label}</button>
              )}
              {j.status === 'OPEN' && <button type="button" className="btn ghost small" onClick={() => setAsk({ type: 'close', job: j })}>Đóng tin</button>}
              {j.applicationCount === 0 && <button type="button" className="btn link small" onClick={() => setAsk({ type: 'delete', job: j })}>Xóa</button>}
            </div>
          </article>
        ))}
      </div>

      {ask?.type === 'status' && (
        <Confirm
          title={NEXT[ask.job.status].title}
          text={`Tin "${ask.job.title}" ${NEXT[ask.job.status].text}`}
          okText={NEXT[ask.job.status].label}
          busy={busy}
          onOk={doAction}
          onClose={() => setAsk(null)}
        />
      )}
      {ask && ask.type !== 'status' && (
        <Confirm
          title={ask.type === 'close' ? 'Đóng tin tuyển dụng?' : 'Xóa tin tuyển dụng?'}
          text={ask.type === 'close'
            ? `Tin "${ask.job.title}" sẽ không hiện trong tìm kiếm và sinh viên không ứng tuyển được nữa. Các đơn đã nhận vẫn được giữ lại.`
            : `Tin "${ask.job.title}" sẽ bị xóa hẳn và không khôi phục được.`}
          okText={ask.type === 'close' ? 'Đóng tin' : 'Xóa tin'}
          danger={ask.type === 'delete'}
          busy={busy}
          onOk={doAction}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
