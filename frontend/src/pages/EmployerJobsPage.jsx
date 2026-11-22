import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import client, { API_URL, errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import ReviewDialog from '../components/ReviewDialog';
import { Confirm, StatusBadge, Toast } from '../components/ui';
import { APP_STATUS, JOB_STATUS, dateText, salaryText } from '../utils/format';

const JOB_TABS = [
  ['OPEN', 'Đang tuyển'],
  ['PENDING', 'Chờ duyệt'],
  ['CLOSED', 'Ngừng tuyển'],
  ['ALL', 'Tất cả'],
];

const APP_TABS = [
  ['PENDING', 'Chờ duyệt'],
  ['ACCEPTED', 'Đã nhận'],
  ['REJECTED', 'Đã từ chối'],
  ['ALL', 'Tất cả'],
];

// PB-12: mỗi trạng thái chỉ có một bước tiếp theo hợp lệ
const NEXT = {
  OPEN: { status: 'FILLED', label: 'Đã đủ người', title: 'Chuyển sang Đã đủ người?', text: 'sẽ ngừng nhận đơn mới. Các sinh viên đã được nhận sẽ nhận thông báo.', done: 'Đã chuyển tin sang Đã đủ người' },
  FILLED: { status: 'COMPLETED', label: 'Hoàn thành', title: 'Xác nhận công việc đã hoàn thành?', text: 'sẽ chuyển sang Hoàn thành. Sau đó bạn và sinh viên có thể đánh giá lẫn nhau.', done: 'Công việc đã hoàn thành, bạn có thể đánh giá sinh viên ở trang Xem ứng viên' },
};

const matchJobTab = (j, k) => {
  if (k === 'ALL') return true;
  if (k === 'OPEN') return j.status === 'OPEN';
  if (k === 'PENDING') return j.status === 'PENDING';
  return j.status !== 'OPEN' && j.status !== 'PENDING';
};

// MH-07 – Quản lý tin của tôi & tổng hợp đơn ứng tuyển ngay trên cùng 1 trang
export default function EmployerJobsPage() {
  const location = useLocation();
  const [view, setView] = useState('jobs'); // 'jobs' | 'apps'

  // Dữ liệu tin tuyển dụng
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState(location.state?.tab || 'OPEN');
  const [askJob, setAskJob] = useState(null); // { type: 'close' | 'delete' | 'status', job }

  // Dữ liệu đơn ứng tuyển (tải khi bấm vào Tổng số đơn / Đơn ứng tuyển chờ duyệt)
  const [apps, setApps] = useState(null);
  const [appTab, setAppTab] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('');
  const [askApp, setAskApp] = useState(null); // { app, status }
  const [reviewed, setReviewed] = useState({});
  const [rate, setRate] = useState(null);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({
    text: location.state?.notice || '',
    type: 'success',
  });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const loadJobs = useCallback(() => client.get('/api/employers/me/jobs')
    .then((res) => setJobs(res.data))
    .catch((err) => setToast({ text: errorMessage(err), type: 'error' })), []);

  const loadApps = useCallback(() => {
    client.get('/api/employers/me/applications')
      .then((res) => setApps(res.data))
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }));
    client.get('/api/reviews/me')
      .then((res) => setReviewed(Object.fromEntries(res.data.map((r) => [r.applicationId, r.rating]))))
      .catch(() => {});
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (view === 'apps' && apps === null) loadApps();
  }, [view, apps, loadApps]);

  useEffect(() => {
    if (location.state?.tab) {
      setView('jobs');
      setTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // Chuyển nhanh qua 3 ô thống kê phía trên
  const openJobsView = () => {
    setView('jobs');
    setTab('OPEN');
  };
  const openAppsView = (nextAppTab) => {
    setView('apps');
    setAppTab(nextAppTab);
  };

  // Thao tác trên tin tuyển dụng
  const doJobAction = async () => {
    const { type, job } = askJob;
    setBusy(true);
    try {
      if (type === 'close') await client.patch(`/api/jobs/${job.id}/close`);
      else if (type === 'status') await client.patch(`/api/jobs/${job.id}/status`, { status: NEXT[job.status].status });
      else await client.delete(`/api/jobs/${job.id}`);
      const done = { close: 'Đã đóng tin, sinh viên không ứng tuyển được nữa', delete: 'Đã xóa tin', status: NEXT[job.status]?.done };
      setToast({ text: done[type], type: 'success' });
      await loadJobs();
      if (apps !== null) loadApps();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAskJob(null);
    }
  };

  // Thao tác duyệt / từ chối đơn ứng tuyển ngay tại chỗ
  const decideApp = async () => {
    setBusy(true);
    try {
      const res = await client.patch(`/api/applications/${askApp.app.id}/status`, { status: askApp.status });
      setApps((list) => list.map((a) => (a.id === res.data.id ? res.data : a)));
      setToast({
        text: askApp.status === 'ACCEPTED' ? `Đã nhận ${askApp.app.fullName}` : `Đã từ chối ${askApp.app.fullName}`,
        type: 'success',
      });
      // Cập nhật lại số liệu trên 3 thẻ thống kê
      loadJobs();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAskApp(null);
    }
  };

  // Số liệu thống kê
  const openJobCount = (jobs || []).filter((j) => j.status === 'OPEN').length;
  const totalApps = (jobs || []).reduce((n, j) => n + j.applicationCount, 0);
  const pendingApps = (jobs || []).reduce((n, j) => n + j.pendingCount, 0);

  // Lọc danh sách tin
  const shownJobs = (jobs || []).filter((j) => matchJobTab(j, tab));

  // Lọc danh sách đơn ứng tuyển
  const jobOptions = useMemo(() => {
    const map = new Map();
    (apps || []).forEach((a) => { if (!map.has(a.jobId)) map.set(a.jobId, a.jobTitle); });
    return Array.from(map.entries());
  }, [apps]);
  const appsByJob = (apps || []).filter((a) => !jobFilter || String(a.jobId) === jobFilter);
  const countApp = (s) => appsByJob.filter((a) => s === 'ALL' || a.status === s).length;
  const shownApps = appsByJob.filter((a) => appTab === 'ALL' || a.status === appTab);

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Tin tuyển dụng của tôi</h1>
          <p className="lead">Đăng tin, theo dõi số đơn và duyệt ứng viên cho từng tin.</p>
        </div>
        <Link to="/employer/jobs/new" className="btn primary big">Đăng tin mới</Link>
      </div>

      {/* 3 thẻ thống kê bấm để chuyển nội dung bên dưới */}
      <div className="stats">
        <button type="button" className={`stat-card ${view === 'jobs' ? 'active' : ''}`} onClick={openJobsView}>
          <b>{openJobCount}</b>
          <span>Tin đang tuyển</span>
        </button>

        <button
          type="button"
          className={`stat-card ${view === 'apps' && appTab !== 'PENDING' ? 'active' : ''}`}
          onClick={() => openAppsView('ALL')}
        >
          <b>{totalApps}</b>
          <span>Tổng số đơn</span>
        </button>

        <button
          type="button"
          className={`stat-card ${pendingApps ? 'hot' : ''} ${view === 'apps' && appTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => openAppsView('PENDING')}
        >
          <b>{pendingApps}</b>
          <span>Đơn ứng tuyển chờ duyệt</span>
        </button>
      </div>

      {/* ===== NỘI DUNG 1: DANH SÁCH TIN TUYỂN DỤNG ===== */}
      {view === 'jobs' && (
        <>
          <div className="tabs">
            {JOB_TABS.map(([k, label]) => (
              <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}<em>{(jobs || []).filter((j) => matchJobTab(j, k)).length}</em>
              </button>
            ))}
          </div>

          {!jobs && <div className="card muted-box">Đang tải danh sách tin...</div>}
          {jobs && shownJobs.length === 0 && (
            <div className="card muted-box">
              <b>{jobs.length === 0 ? 'Bạn chưa đăng tin nào' : 'Không có tin ở mục này'}</b>
              <p>{tab === 'PENDING' ? 'Các tin mới đăng sẽ hiện ở đây trong lúc chờ quản trị viên duyệt.' : 'Bấm Đăng tin mới để bắt đầu nhận hồ sơ sinh viên.'}</p>
            </div>
          )}

          <div className="rows">
            {shownJobs.map((j) => (
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
                  {j.status === 'REJECTED' && j.rejectReason && (
                    <p className="reject-note">Lý do từ chối: {j.rejectReason}</p>
                  )}
                </div>
                <div className="emp-count">
                  <b>{j.applicationCount}</b><span>đơn</span>
                  {j.pendingCount > 0 && <em>{j.pendingCount} chờ duyệt</em>}
                </div>
                <div className="emp-actions">
                  {j.status !== 'PENDING' && j.status !== 'REJECTED' && (
                    <Link to={`/employer/jobs/${j.id}/applicants`} className="btn primary small">Xem ứng viên</Link>
                  )}
                  {(j.status === 'OPEN' || j.status === 'PENDING' || j.status === 'REJECTED') && (
                    <Link to={`/employer/jobs/${j.id}/edit`} className="btn ghost small">Sửa</Link>
                  )}
                  {NEXT[j.status] && !j.hidden && j.applicationCount > 0 && (
                    <button type="button" className="btn accent small" onClick={() => setAskJob({ type: 'status', job: j })}>
                      {NEXT[j.status].label}
                    </button>
                  )}
                  {j.status === 'OPEN' && (
                    <button type="button" className="btn ghost small" onClick={() => setAskJob({ type: 'close', job: j })}>Đóng tin</button>
                  )}
                  {j.applicationCount === 0 && (
                    <button type="button" className="btn link small" onClick={() => setAskJob({ type: 'delete', job: j })}>Xóa</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* ===== NỘI DUNG 2: DANH SÁCH ĐƠN ỨNG TUYỂN ===== */}
      {view === 'apps' && (
        <>
          <div className="emp-app-bar">
            <div className="tabs">
              {APP_TABS.map(([k, label]) => (
                <button key={k} type="button" className={appTab === k ? 'on' : ''} onClick={() => setAppTab(k)}>
                  {label}<em>{countApp(k)}</em>
                </button>
              ))}
            </div>
            {jobOptions.length > 1 && (
              <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Lọc theo tin tuyển dụng">
                <option value="">Tất cả tin tuyển dụng</option>
                {jobOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
              </select>
            )}
          </div>

          {!apps && <div className="card muted-box">Đang tải danh sách đơn ứng tuyển...</div>}
          {apps && shownApps.length === 0 && (
            <div className="card muted-box">
              <b>{apps.length === 0 ? 'Chưa có ứng viên nào nộp đơn' : 'Không có đơn ứng tuyển ở mục này'}</b>
              <p>Đơn ứng tuyển mới từ sinh viên sẽ xuất hiện tại mục Chờ duyệt.</p>
            </div>
          )}

          <div className="rows">
            {shownApps.map((a) => (
              <article key={a.id} className={`row-card applicant st-${APP_STATUS[a.status]?.[1]}`}>
                <div className="avatar big-av">{initials(a.fullName)}</div>
                <div className="row-main">
                  <div className="app-job-row">
                    <b className="app-name">{a.fullName}</b>
                    <Link to={`/employer/jobs/${a.jobId}/applicants`} className="app-job-tag">
                      Tin: {a.jobTitle}
                    </Link>
                  </div>
                  <div className="job-company">{[a.school, a.major].filter(Boolean).join(' · ') || 'Chưa cập nhật trường, ngành'}</div>
                  {a.skills && (
                    <div className="chips">{a.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => <em key={s}>{s}</em>)}</div>
                  )}
                  {a.coverLetter && <p className="letter">{a.coverLetter}</p>}
                  <div className="contact">
                    <span>{a.email}</span>
                    {a.phone && <span>{a.phone}</span>}
                    <span>Nộp ngày {dateText(a.appliedAt)}</span>
                    {a.cvUrl
                      ? <a href={API_URL + a.cvUrl} target="_blank" rel="noreferrer">Xem CV</a>
                      : <span>Không kèm CV</span>}
                  </div>
                </div>
                <div className="row-side">
                  <StatusBadge map={APP_STATUS} value={a.status} />
                  {a.status === 'PENDING' && (
                    <div className="decide">
                      <button type="button" className="btn primary small" onClick={() => setAskApp({ app: a, status: 'ACCEPTED' })}>Duyệt</button>
                      <button type="button" className="btn ghost small" onClick={() => setAskApp({ app: a, status: 'REJECTED' })}>Từ chối</button>
                    </div>
                  )}
                  {a.status === 'ACCEPTED' && a.jobStatus === 'COMPLETED' && !reviewed[a.id] && (
                    <button type="button" className="btn accent small" onClick={() => setRate(a)}>Đánh giá sinh viên</button>
                  )}
                  {reviewed[a.id] && <span className="rated">Đã đánh giá {reviewed[a.id]}/5</span>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Hộp thoại xác nhận cho tin tuyển dụng */}
      {askJob?.type === 'status' && (
        <Confirm
          title={NEXT[askJob.job.status].title}
          text={`Tin "${askJob.job.title}" ${NEXT[askJob.job.status].text}`}
          okText={NEXT[askJob.job.status].label}
          busy={busy}
          onOk={doJobAction}
          onClose={() => setAskJob(null)}
        />
      )}
      {askJob && askJob.type !== 'status' && (
        <Confirm
          title={askJob.type === 'close' ? 'Đóng tin tuyển dụng?' : 'Xóa tin tuyển dụng?'}
          text={askJob.type === 'close'
            ? `Tin "${askJob.job.title}" sẽ không hiện trong tìm kiếm và sinh viên không ứng tuyển được nữa. Các đơn đã nhận vẫn được giữ lại.`
            : `Tin "${askJob.job.title}" sẽ bị xóa hẳn và không khôi phục được.`}
          okText={askJob.type === 'close' ? 'Đóng tin' : 'Xóa tin'}
          danger={askJob.type === 'delete'}
          busy={busy}
          onOk={doJobAction}
          onClose={() => setAskJob(null)}
        />
      )}

      {/* Hộp thoại xác nhận duyệt / từ chối đơn */}
      {askApp && (
        <Confirm
          title={askApp.status === 'ACCEPTED' ? 'Duyệt ứng viên?' : 'Từ chối ứng viên?'}
          text={askApp.status === 'ACCEPTED'
            ? `${askApp.app.fullName} sẽ thấy đơn cho tin "${askApp.app.jobTitle}" chuyển sang "Đã được nhận". Bạn nên liên hệ qua ${askApp.app.email} để hẹn lịch làm việc.`
            : `${askApp.app.fullName} sẽ thấy đơn cho tin "${askApp.app.jobTitle}" chuyển sang "Chưa phù hợp". Không đổi lại được sau khi xác nhận.`}
          okText={askApp.status === 'ACCEPTED' ? 'Duyệt' : 'Từ chối'}
          danger={askApp.status === 'REJECTED'}
          busy={busy}
          onOk={decideApp}
          onClose={() => setAskApp(null)}
        />
      )}

      {/* Hộp thoại đánh giá sinh viên */}
      {rate && (
        <ReviewDialog
          app={{ id: rate.id, jobTitle: rate.jobTitle }}
          who={rate.fullName}
          onClose={() => setRate(null)}
          onDone={(r) => {
            setReviewed((m) => ({ ...m, [r.applicationId]: r.rating }));
            setRate(null);
            setToast({ text: `Đã gửi đánh giá cho ${rate.fullName}`, type: 'success' });
          }}
        />
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}