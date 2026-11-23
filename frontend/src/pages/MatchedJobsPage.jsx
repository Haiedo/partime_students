import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { AreaFilter } from '../components/AreaSelect';
import { initials } from '../components/Layout';
import { Toast } from '../components/ui';
import { CATEGORIES, daysAgo, salaryText } from '../utils/format';

const DAYS = [
  ['T2', 'Thứ 2'],
  ['T3', 'Thứ 3'],
  ['T4', 'Thứ 4'],
  ['T5', 'Thứ 5'],
  ['T6', 'Thứ 6'],
  ['T7', 'Thứ 7'],
  ['CN', 'CN'],
];

const SHIFTS = [
  ['Sáng', 'Trước 12h'],
  ['Chiều', '12h – 18h'],
  ['Tối', 'Từ 18h'],
];

const SALARY = [
  ['', 'Mọi mức lương'],
  ['25000', 'Từ 25.000đ/giờ'],
  ['30000', 'Từ 30.000đ/giờ'],
  ['35000', 'Từ 35.000đ/giờ'],
];

const ALL_SLOTS = (1 << 21) - 1;
const bitOf = (dayIdx, shiftIdx) => 1 << (dayIdx * 3 + shiftIdx);

const makeMask = (dayIdxs, shiftIdxs) => {
  let mask = 0;
  dayIdxs.forEach((d) => shiftIdxs.forEach((s) => { mask |= bitOf(d, s); }));
  return mask;
};

const PRESETS = [
  ['Tối T2 – T6', makeMask([0, 1, 2, 3, 4], [2])],
  ['Sáng T2 – T6', makeMask([0, 1, 2, 3, 4], [0])],
  ['Chiều T2 – T6', makeMask([0, 1, 2, 3, 4], [1])],
  ['Cuối tuần (T7, CN)', makeMask([5, 6], [0, 1, 2])],
  ['Cả tuần', ALL_SLOTS],
];

const EMPTY_FILTER = { category: '', location: '', minSalary: '', sort: 'newest', page: 0 };

function countSlots(mask) {
  let n = 0;
  for (let i = 0; i < 21; i += 1) if ((mask & (1 << i)) !== 0) n += 1;
  return n;
}

export default function MatchedJobsPage() {
  const [draft, setDraft] = useState(0);
  const [confirmed, setConfirmed] = useState(0);
  const [loadedInit, setLoadedInit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState(EMPTY_FILTER);
  const [data, setData] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  // Tải lịch rảnh đã lưu và danh sách tin đã lưu
  useEffect(() => {
    client.get('/api/students/me/availability')
      .then((res) => {
        const s = res.data.availableSlots || 0;
        setDraft(s);
        setConfirmed(s);
      })
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }))
      .finally(() => setLoadedInit(true));

    client.get('/api/students/me/saved-jobs', { params: { size: 100 } })
      .then((res) => setSavedIds(new Set(res.data.content.map((x) => x.jobId))))
      .catch(() => {});
  }, []);

  // Tải danh sách việc phù hợp mỗi khi đã xác nhận khung giờ hoặc đổi bộ lọc
  useEffect(() => {
    if (!loadedInit) return;
    if (confirmed === 0) {
      setData(null);
      return;
    }
    setLoadingJobs(true);
    const params = Object.fromEntries(
      Object.entries({ ...query, size: 10 }).filter(([, v]) => v !== ''),
    );
    if (params.minSalary) params.salaryUnit = 'HOUR';
    client.get('/api/students/me/matched-jobs', { params })
      .then((res) => setData(res.data))
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }))
      .finally(() => setLoadingJobs(false));
  }, [loadedInit, confirmed, query]);

  const toggleCell = (d, s) => setDraft((m) => m ^ bitOf(d, s));

  const toggleDay = (d) => {
    const colMask = makeMask([d], [0, 1, 2]);
    setDraft((m) => ((m & colMask) === colMask ? (m & ~colMask) : (m | colMask)));
  };

  const toggleShift = (s) => {
    const rowMask = makeMask([0, 1, 2, 3, 4, 5, 6], [s]);
    setDraft((m) => ((m & rowMask) === rowMask ? (m & ~rowMask) : (m | rowMask)));
  };

  const onConfirm = async () => {
    setSaving(true);
    try {
      const res = await client.put('/api/students/me/availability', { availableSlots: draft });
      const savedSlots = res.data.availableSlots;
      setConfirmed(savedSlots);
      setQuery((q) => ({ ...q, page: 0 }));
      setToast({
        text: savedSlots
          ? 'Đã lưu khung giờ rảnh. Bạn sẽ nhận thông báo khi có việc mới phù hợp'
          : 'Đã xóa khung giờ rảnh',
        type: 'success',
      });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSave = async (jobId) => {
    const on = savedIds.has(jobId);
    try {
      if (on) await client.delete(`/api/students/me/saved-jobs/${jobId}`);
      else await client.put(`/api/students/me/saved-jobs/${jobId}`);
      const next = new Set(savedIds);
      if (on) next.delete(jobId); else next.add(jobId);
      setSavedIds(next);
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    }
  };

  const setFilter = (key, value) => setQuery((q) => ({ ...q, [key]: value, page: 0 }));
  const hasFilter = Boolean(query.category || query.location || query.minSalary);
  const changed = draft !== confirmed;
  const jobs = data?.content || [];

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Việc phù hợp với lịch rảnh</h1>
          <p className="lead">
            Chọn các buổi bạn rảnh trong tuần rồi bấm Xác nhận. Hệ thống chỉ hiển thị việc có giờ làm nằm gọn trong lịch bạn chọn và tự động thông báo khi có tin mới khớp lịch.
          </p>
        </div>
      </div>

      {/* Khung chọn lịch rảnh 7 ngày x 3 buổi */}
      <section className="card avail-card">
        <div className="card-head">
          <h2>Khung giờ rảnh của bạn ({countSlots(draft)} buổi)</h2>
          {changed && <span className="unsaved">Chưa xác nhận thay đổi</span>}
        </div>

        <div className="avail-presets">
          {PRESETS.map(([label, mask]) => (
            <button key={label} type="button" className={draft === mask ? 'on' : ''} onClick={() => setDraft(mask)}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => setDraft(0)}>Xóa chọn</button>
        </div>

        <div className="avail-wrap">
          <table className="avail-grid">
            <thead>
              <tr>
                <th>Buổi \ Ngày</th>
                {DAYS.map(([code, label], d) => (
                  <th key={code}>
                    <button type="button" className="avail-head-btn" onClick={() => toggleDay(d)} title={`Chọn cả ${label}`}>
                      {label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map(([name, time], s) => (
                <tr key={name}>
                  <th>
                    <button type="button" className="avail-head-btn row" onClick={() => toggleShift(s)}>
                      <b>{name}</b><small>{time}</small>
                    </button>
                  </th>
                  {DAYS.map(([code], d) => {
                    const active = (draft & bitOf(d, s)) !== 0;
                    return (
                      <td key={code}>
                        <button
                          type="button"
                          className={`slot-cell ${active ? 'on' : ''}`}
                          aria-pressed={active}
                          onClick={() => toggleCell(d, s)}
                        >
                          {active ? 'Rảnh' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-foot">
          <button type="button" className="btn primary big" disabled={saving || !loadedInit} onClick={onConfirm}>
            {saving ? 'Đang lưu...' : 'Xác nhận khung giờ'}
          </button>
          {changed && (
            <button type="button" className="btn link" onClick={() => setDraft(confirmed)}>Hoàn tác</button>
          )}
          {confirmed > 0 && !changed && (
            <span className="avail-status">Đang bật thông báo khi có việc mới phù hợp lịch này</span>
          )}
        </div>
      </section>

      {/* Bộ lọc 3 cột & danh sách việc phù hợp (chỉ hiện sau khi sinh viên xác nhận khung giờ) */}
      {loadedInit && confirmed === 0 && (
        <div className="card muted-box">
          <b>Bạn chưa chọn khung giờ rảnh</b>
          <p>Hãy chọn ít nhất 1 buổi rảnh ở bảng phía trên rồi bấm "Xác nhận khung giờ" để xem các công việc phù hợp.</p>
        </div>
      )}

      {confirmed > 0 && (
        <>
          <div className="search-band match-filter">
            <div className="match-filter-grid">
              <select className={query.category ? 'set' : ''} value={query.category} aria-label="Ngành nghề"
                onChange={(e) => setFilter('category', e.target.value)}>
                <option value="">Tất cả ngành nghề</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <AreaFilter className={query.location ? 'set' : ''} value={query.location}
                onChange={(v) => setFilter('location', v)} />
              <select className={query.minSalary ? 'set' : ''} value={query.minSalary} aria-label="Mức lương"
                onChange={(e) => setFilter('minSalary', e.target.value)}>
                {SALARY.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="card list-head">
            <div className="list-title">
              <span>
                {loadingJobs
                  ? 'Đang tìm công việc phù hợp...'
                  : <>Tìm thấy <b>{data?.totalElements ?? 0}</b> công việc phù hợp với lịch rảnh của bạn</>}
              </span>
              <span className="list-tools">
                {hasFilter && (
                  <button type="button" className="link-btn" onClick={() => setQuery(EMPTY_FILTER)}>Xóa bộ lọc</button>
                )}
                <select className="sort" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sắp xếp">
                  <option value="newest">Mới nhất</option>
                  <option value="salary">Lương cao nhất</option>
                </select>
              </span>
            </div>
          </div>

          {!loadingJobs && jobs.length === 0 && (
            <div className="card muted-box">
              <b>Chưa có công việc nào nằm gọn trong khung giờ này</b>
              <p>Thử mở rộng thêm buổi rảnh hoặc bỏ bớt bộ lọc. Hệ thống sẽ gửi thông báo ngay khi có việc mới phù hợp.</p>
            </div>
          )}

          {!loadingJobs && jobs.map((j) => (
            <article key={j.id} className="job">
              <div className="job-logo">{initials(j.companyName)}</div>
              <div className="job-body">
                <Link to={`/jobs/${j.id}`} className="job-title">{j.title}</Link>
                <div className="job-company">{j.companyName}</div>
                <div className="job-meta">
                  <span className="salary">{salaryText(j)}</span>
                  <span className="chip">{j.location}</span>
                  <span className="chip">{j.category}</span>
                  <span className="chip">{j.workTime}</span>
                </div>
              </div>
              <div className="job-side">
                <span className="when">{daysAgo(j.createdAt)}</span>
                <div className="row-btns">
                  <button type="button" className={`btn small save-mini ${savedIds.has(j.id) ? 'on' : ''}`}
                    aria-pressed={savedIds.has(j.id)} onClick={() => toggleSave(j.id)}>
                    {savedIds.has(j.id) ? 'Đã lưu' : 'Lưu tin'}
                  </button>
                  <Link to={`/jobs/${j.id}`} className="btn ghost small">Xem chi tiết</Link>
                </div>
              </div>
            </article>
          ))}

          {data && data.totalPages > 1 && (
            <div className="pager">
              <button type="button" className="btn ghost small" disabled={query.page === 0}
                onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>Trang trước</button>
              <span>Trang {query.page + 1} / {data.totalPages}</span>
              <button type="button" className="btn ghost small" disabled={query.page + 1 >= data.totalPages}
                onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>Trang sau</button>
            </div>
          )}
        </>
      )}

      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}