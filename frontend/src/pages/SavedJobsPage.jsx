import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import { StatusBadge, Toast } from '../components/ui';
import { JOB_STATUS, dateText, salaryText } from '../utils/format';

const PAGE_SIZE = 10;

// MH-15 – Việc đã lưu (PB-20): tin mới lưu lên đầu, có nhãn Đang tuyển / Đã đóng, nút Bỏ lưu
export default function SavedJobsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const load = useCallback((p) => {
    client.get('/api/students/me/saved-jobs', { params: { page: p, size: PAGE_SIZE } })
      .then((res) => { setData(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const unsave = async (jobId) => {
    setBusy(jobId);
    try {
      await client.delete(`/api/students/me/saved-jobs/${jobId}`);
      // Bỏ lưu tin cuối cùng của trang -> lùi về trang trước
      if (data.content.length === 1 && page > 0) setPage(page - 1);
      else load(page);
      setToast({ text: 'Đã bỏ lưu tin', type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const total = data?.totalElements ?? 0;
  const open = data?.content.filter((x) => x.status === 'OPEN').length ?? 0;

  return (
    <div className="list-page">
      <div className="job-strip">
        <div>
          <h1>Việc đã lưu</h1>
          <p className="hint">{data ? `${total} tin đã lưu${total ? ` · ${open} tin trên trang này đang tuyển` : ''}` : 'Đang tải...'}</p>
        </div>
        <Link to="/" className="btn ghost">Tìm thêm việc</Link>
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}

      {data && total === 0 && (
        <div className="card muted-box empty-box">
          <b>Bạn chưa lưu tin nào</b>
          <p>Bấm "Lưu tin" ở trang chi tiết để giữ lại những việc muốn xem kỹ hoặc ứng tuyển sau.</p>
          <Link to="/" className="btn primary">Xem việc làm</Link>
        </div>
      )}

      {data?.content.map((s) => {
        const j = s.job;
        const closed = s.status !== 'OPEN';
        return (
          <article className={`job saved-job ${closed ? 'is-closed' : ''}`} key={s.jobId}>
            <div className="job-logo">{initials(j.companyName)}</div>
            <div className="job-body">
              <Link to={`/jobs/${s.jobId}`} className="job-title">{j.title}</Link>
              <div className="job-company">{j.companyName}</div>
              <div className="job-meta">
                <StatusBadge map={JOB_STATUS} value={s.status} />
                <span className="salary">{salaryText(j)}</span>
                <span className="chip">{j.location}</span>
                <span className="chip">{j.workTime}</span>
              </div>
            </div>
            <div className="job-side">
              <span className="when">Lưu ngày {dateText(s.savedAt)}</span>
              <div className="row-btns">
                <button type="button" className="btn link small" disabled={busy === s.jobId} onClick={() => unsave(s.jobId)}>
                  {busy === s.jobId ? 'Đang bỏ...' : 'Bỏ lưu'}
                </button>
                <Link to={`/jobs/${s.jobId}`} className="btn ghost small">{closed ? 'Xem lại' : 'Xem chi tiết'}</Link>
              </div>
            </div>
          </article>
        );
      })}

      {data && data.totalPages > 1 && (
        <div className="pager">
          <button type="button" className="btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button>
          <span>Trang {page + 1}/{data.totalPages}</span>
          <button type="button" className="btn ghost small" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      )}
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
