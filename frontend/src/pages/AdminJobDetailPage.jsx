import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import { Confirm, Modal, StatusBadge, Toast } from '../components/ui';
import { JOB_STATUS, dateText, daysAgo, salaryText } from '../utils/format';

const USER_STATUS = { ACTIVE: ['Đang hoạt động', 'open'], LOCKED: ['Đã khóa', 'rejected'] };

export default function AdminJobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [ask, setAsk] = useState(null); // 'approve' | 'reject' | 'hide' | 'unhide'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const load = useCallback(() => {
    client.get(`/api/admin/jobs/${id}`)
      .then((res) => { setJob(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openAsk = (type) => {
    setReason('');
    setAsk(type);
  };

  const submitAction = async () => {
    setBusy(true);
    try {
      if (ask === 'approve') {
        await client.patch(`/api/admin/jobs/${job.id}/approve`);
        setToast({ text: `Đã duyệt tin "${job.title}"`, type: 'success' });
      } else if (ask === 'reject') {
        await client.patch(`/api/admin/jobs/${job.id}/reject`, { reason: reason.trim() || null });
        setToast({ text: `Đã từ chối tin "${job.title}"`, type: 'success' });
      } else if (ask === 'hide') {
        await client.patch(`/api/admin/jobs/${job.id}/hide`);
        setToast({ text: `Đã ẩn tin "${job.title}"`, type: 'success' });
      } else {
        await client.patch(`/api/admin/jobs/${job.id}/unhide`);
        setToast({ text: `Đã hiện lại tin "${job.title}"`, type: 'success' });
      }
      load();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  if (error) {
    return (
      <div className="card muted-box">
        <b>{error}</b>
        <p><Link to="/admin?tab=jobs">Quay lại danh sách Tin đăng</Link></p>
      </div>
    );
  }
  if (!job) return <div className="card muted-box">Đang tải chi tiết tin tuyển dụng...</div>;

  return (
    <div className="detail">
      <div className="crumb">
        <Link to="/admin?tab=jobs">Quản trị</Link> / <Link to="/admin?tab=jobs">Tin đăng</Link> / {job.title}
      </div>

      <section className="card detail-head">
        <div className="job-logo big">{initials(job.companyName)}</div>
        <div className="detail-title">
          <h1>{job.title}</h1>
          <div className="job-company">
            <Link to={`/admin/users/${job.employerUserId}`}>{job.companyName}</Link>
          </div>
          <div className="job-meta">
            {job.hidden ? <span className="badge rejected">Đã ẩn</span> : <StatusBadge map={JOB_STATUS} value={job.status} />}
            <span className="chip">{job.category}</span>
            <span className="chip">{job.applicationCount} đơn ứng tuyển</span>
            <span className="when">{daysAgo(job.createdAt)} ({dateText(job.createdAt)})</span>
          </div>
        </div>
        <div className="detail-action admin-detail-actions">
          {job.status === 'PENDING' && (
            <>
              <button type="button" className="btn primary full" onClick={() => openAsk('approve')}>Duyệt tin</button>
              <button type="button" className="btn danger full" onClick={() => openAsk('reject')}>Từ chối duyệt</button>
            </>
          )}
          {job.status === 'REJECTED' && (
            <button type="button" className="btn primary full" onClick={() => openAsk('approve')}>Duyệt lại tin</button>
          )}
          {job.status !== 'PENDING' && job.status !== 'REJECTED' && (
            <button
              type="button"
              className={`btn full ${job.hidden ? 'primary' : 'danger'}`}
              onClick={() => openAsk(job.hidden ? 'unhide' : 'hide')}
            >
              {job.hidden ? 'Hiện lại tin' : 'Ẩn tin vi phạm'}
            </button>
          )}
          <Link to="/admin?tab=jobs" className="btn ghost full">Quay lại danh sách</Link>
        </div>
      </section>

      {job.status === 'REJECTED' && job.rejectReason && (
        <div className="reject-note">
          <b>Lý do từ chối duyệt:</b> {job.rejectReason}
        </div>
      )}

      <div className="detail-grid">
        <section className="card">
          <div className="facts">
            <div><span>Mức lương</span><b className="salary">{salaryText(job)}</b></div>
            <div><span>Địa điểm</span><b>{job.location}</b></div>
            <div><span>Thời gian làm việc</span><b>{job.workTime}</b></div>
            <div><span>Số lượng cần tuyển</span><b>{job.slots} người</b></div>
          </div>
          <h2>Mô tả công việc</h2>
          <p className="desc">{job.description}</p>
        </section>

        <aside className="side-col">
          <div className="card">
            <h2>Nhà tuyển dụng</h2>
            <div className="preview">
              <div className="job-logo">{initials(job.companyName)}</div>
              <div>
                <Link to={`/admin/users/${job.employerUserId}`}><b>{job.companyName}</b></Link>
                <span>{job.companyAddress || 'Chưa cập nhật địa chỉ'}</span>
              </div>
            </div>
            <div className="admin-emp-meta">
              <span>Người đại diện: <b>{job.employerFullName}</b></span>
              <span>Tài khoản: {job.employerEmail}</span>
              <span>Trạng thái: <StatusBadge map={USER_STATUS} value={job.employerStatus} /></span>
            </div>
            {job.companyDescription && <p className="preview-text">{job.companyDescription}</p>}
            <div className="preview-contact">
              {job.contactEmail && <span>Email liên hệ: {job.contactEmail}</span>}
              {job.contactPhone && <span>SĐT liên hệ: {job.contactPhone}</span>}
            </div>
            <Link to={`/admin/users/${job.employerUserId}`} className="btn ghost full mt8">
              Xem tài khoản nhà tuyển dụng
            </Link>
          </div>
        </aside>
      </div>

      {ask === 'approve' && (
        <Confirm
          title="Duyệt tin tuyển dụng?"
          text={`Tin "${job.title}" của ${job.companyName} sẽ được hiển thị công khai trên trang chủ và gửi thông báo tới các sinh viên phù hợp.`}
          okText="Duyệt tin"
          busy={busy}
          onOk={submitAction}
          onClose={() => setAsk(null)}
        />
      )}

      {ask === 'reject' && (
        <Modal title="Từ chối duyệt tin" onClose={() => setAsk(null)} footer={(
          <>
            <button type="button" className="btn link" onClick={() => setAsk(null)}>Hủy</button>
            <button type="button" className="btn danger" disabled={busy} onClick={submitAction}>
              {busy ? 'Đang xử lý...' : 'Từ chối tin'}
            </button>
          </>
        )}>
          <p className="modal-text">
            Tin <b>{job.title}</b> sẽ không hiển thị công khai. Nhà tuyển dụng sẽ nhận thông báo và có thể sửa lại để gửi duyệt.
          </p>
          <label>Lý do từ chối <small>(không bắt buộc, tối đa 500 ký tự)</small>
            <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Mức lương không rõ ràng, nội dung thiếu thông tin ca làm..." />
            <small className="count">{reason.length}/500</small>
          </label>
        </Modal>
      )}

      {(ask === 'hide' || ask === 'unhide') && (
        <Confirm
          title={ask === 'unhide' ? 'Hiện lại tin?' : 'Ẩn tin vi phạm?'}
          text={ask === 'unhide'
            ? `Tin "${job.title}" sẽ hiện lại trong kết quả tìm kiếm.`
            : `Tin "${job.title}" của ${job.companyName} sẽ biến mất khỏi tìm kiếm và trang chi tiết, sinh viên không ứng tuyển được. Nhà tuyển dụng sẽ nhận thông báo. Tin không bị xóa.`}
          okText={ask === 'unhide' ? 'Hiện lại' : 'Ẩn tin'}
          danger={ask === 'hide'}
          busy={busy}
          onOk={submitAction}
          onClose={() => setAsk(null)}
        />
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}