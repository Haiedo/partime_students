import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { Toast } from '../components/ui';
import { CATEGORIES, UNIT, salaryText } from '../utils/format';
import { DAYS, DAY_NAMES, DAY_PRESETS, SHIFT_PRESETS, TIMES, checkWorkTime, composeWorkTime, parseWorkTime, presetOf } from '../utils/workTime';
import { AreaSelect } from '../components/AreaSelect';

const EMPTY = {
  title: '', category: '', location: '', salaryMin: '', salaryMax: '', salaryUnit: 'HOUR',
  workTime: '', slots: 1, description: '',
};

// MH-08 – Form đăng / sửa tin (PB-05, PB-06). Dùng chung một form cho cả đăng mới và sửa.
export default function JobFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ text: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [wt, setWt] = useState(parseWorkTime('')); // ngày + giờ làm, ghép thành form.workTime khi lưu
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  useEffect(() => {
    if (!editing) return;
    client.get(`/api/employers/me/jobs/${id}`)
      .then(({ data }) => {
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? ''])));
        setWt(parseWorkTime(data.workTime || ''));
      })
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, [editing, id]);

  // Gõ lại vào ô nào thì ẩn lỗi của ô đó
  const set = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  // Chọn / bỏ chọn ngày, chọn nhanh cả nhóm ngày
  const changeWt = (next) => {
    setWt(next);
    if (errors.workTime) setErrors({ ...errors, workTime: undefined });
  };
  const toggleDay = (d) => changeWt({ ...wt, days: wt.days.includes(d) ? wt.days.filter((x) => x !== d) : [...wt.days, d] });
  // "Tự chọn từng ngày" giữ trạng thái riêng để hiện các ô chọn ngày kể cả khi chưa chọn ngày nào
  const [customDays, setCustomDays] = useState(false);
  const dayPreset = customDays ? 'custom' : presetOf(wt.days);
  const pickDays = (v) => {
    if (v === 'custom') { setCustomDays(true); return; }
    setCustomDays(false);
    changeWt({ ...wt, days: DAY_PRESETS.find(([k]) => k === v)?.[2] || [] });
  };
  const pickShift = (i) => {
    if (i === '') return;
    const [, start, end] = SHIFT_PRESETS[Number(i)];
    changeWt({ ...wt, start, end });
  };
  const timeOpts = (extra) => (extra && !TIMES.includes(extra) ? [extra, ...TIMES] : TIMES);
  const workTime = composeWorkTime(wt);

  const submit = async (e) => {
    e.preventDefault();
    const wtError = checkWorkTime(wt);
    const pre = {};
    if (!form.location) pre.location = 'Vui lòng chọn địa điểm làm việc';
    if (wtError) pre.workTime = wtError;
    if (Object.keys(pre).length) {
      setErrors(pre);
      setToast({ text: pre.location || pre.workTime, type: 'error' });
      return;
    }
    setErrors({});
    setSaving(true);
    const body = {
      ...form,
      workTime,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      slots: form.slots === '' ? null : Number(form.slots),
    };
    try {
      if (editing) await client.put(`/api/jobs/${id}`, body);
      else await client.post('/api/jobs', body);
      navigate('/employer/jobs');
    } catch (err) {
      setErrors(fieldErrors(err));
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, { wide, ...props } = {}) => (
    <label className={wide ? 'wide' : ''}>{label}
      <input name={name} value={form[name]} onChange={set} className={errors[name] ? 'invalid' : ''} {...props} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );

  if (loading) return <div className="card muted-box">Đang tải tin...</div>;

  return (
    <div className="list-page">
      <div className="crumb"><Link to="/employer/jobs">Tin của tôi</Link> / {editing ? 'Sửa tin' : 'Đăng tin mới'}</div>
      <div className="form-grid">
        <form className="card" onSubmit={submit} noValidate>
          <div className="card-head"><h2>{editing ? 'Sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</h2></div>
          {/* 1. Thông tin chung */}
          <fieldset className="form-sec">
            <legend>Thông tin chung</legend>
            <div className="grid">
              {field('title', 'Tiêu đề tin *', { wide: true, placeholder: 'vd: Phục vụ quán cà phê ca tối', maxLength: 200 })}
              <label className="wide">Ngành nghề *
                <select name="category" value={form.category} onChange={set} className={errors.category ? 'invalid' : ''}>
                  <option value="">Chọn ngành nghề</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <span className="error">{errors.category}</span>}
              </label>
              <label className="wide">Địa điểm làm việc *
                <AreaSelect value={form.location} invalid={!!errors.location} wholeLabel="Nhiều khu vực trong tỉnh/thành"
                  onChange={(v) => { setForm({ ...form, location: v }); if (errors.location) setErrors({ ...errors, location: undefined }); }} />
                {errors.location && <span className="error">{errors.location}</span>}
              </label>
            </div>
          </fieldset>

          {/* 2. Thời gian làm việc: chọn ngày và khung giờ thay cho ô nhập tay */}
          <fieldset className={`form-sec ${errors.workTime ? 'has-error' : ''}`}>
            <legend>Thời gian làm việc *</legend>
            <div className="wt-grid">
              <label>Ngày làm
                <select value={dayPreset} onChange={(e) => pickDays(e.target.value)}>
                  <option value="">Chọn ngày làm</option>
                  {DAY_PRESETS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  <option value="custom">Tự chọn từng ngày</option>
                </select>
              </label>
              <label>Ca mẫu (chọn nhanh)
                <select value="" onChange={(e) => pickShift(e.target.value)}>
                  <option value="">Chọn ca có sẵn</option>
                  {SHIFT_PRESETS.map(([label], i) => <option key={label} value={i}>{label}</option>)}
                </select>
              </label>
              <label>Giờ bắt đầu
                <select value={wt.start} onChange={(e) => changeWt({ ...wt, start: e.target.value })}>
                  <option value="">Chọn giờ</option>
                  {timeOpts(wt.start).filter((t) => t !== '24:00').map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Giờ kết thúc
                <select value={wt.end} onChange={(e) => changeWt({ ...wt, end: e.target.value })}>
                  <option value="">Chọn giờ</option>
                  {timeOpts(wt.end).filter((t) => !wt.start || t > wt.start).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            {dayPreset === 'custom' && (
              <div className="day-pick" role="group" aria-label="Chọn từng ngày">
                {DAYS.map((d) => (
                  <label key={d} className={`day-check ${wt.days.includes(d) ? 'on' : ''}`}>
                    <input type="checkbox" checked={wt.days.includes(d)} onChange={() => toggleDay(d)} />
                    {DAY_NAMES[d]}
                  </label>
                ))}
              </div>
            )}
            <label className="wt-note">Ghi chú thêm (không bắt buộc)
              <input value={wt.note} maxLength={100} placeholder="vd: có thể xoay ca, làm tối thiểu 3 buổi/tuần"
                onChange={(e) => changeWt({ ...wt, note: e.target.value })} />
            </label>
            <div className="wt-result">Hiển thị trên tin: <b>{workTime || 'chưa chọn'}</b></div>
            {errors.workTime && <span className="error">{errors.workTime}</span>}
          </fieldset>

          {/* 3. Lương và số lượng */}
          <fieldset className="form-sec">
            <legend>Lương và số lượng</legend>
            <div className="grid grid-3">
              {field('salaryMin', 'Lương từ (đồng)', { type: 'number', min: 0, step: 1000, placeholder: 'vd: 25000' })}
              {field('salaryMax', 'Lương đến (đồng)', { type: 'number', min: 0, step: 1000, placeholder: 'vd: 30000' })}
              <label>Tính lương theo *
                <select name="salaryUnit" value={form.salaryUnit} onChange={set}>
                  {Object.entries(UNIT).map(([k, v]) => <option key={k} value={k}>Theo {v}</option>)}
                </select>
              </label>
              {field('slots', 'Cần tuyển (người) *', { type: 'number', min: 1, max: 100 })}
            </div>
          </fieldset>

          {/* 4. Mô tả */}
          <fieldset className="form-sec">
            <legend>Mô tả công việc *</legend>
            <label className="wide">
              <textarea name="description" rows="7" value={form.description} onChange={set} maxLength={5000}
                className={errors.description ? 'invalid' : ''} aria-label="Mô tả công việc"
                placeholder="Công việc cụ thể, yêu cầu, quyền lợi, cách nhận lương..." />
              <span className="count">{form.description.length}/5000 ký tự</span>
              {errors.description && <span className="error">{errors.description}</span>}
            </label>
          </fieldset>
          <div className="form-foot">
            <button className="btn primary big" disabled={saving}>{saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Đăng tin')}</button>
            <Link to="/employer/jobs" className="btn link">Hủy</Link>
          </div>
        </form>

        <aside className="side-col">
          <div className="card">
            <h2>Sinh viên sẽ thấy</h2>
            <article className="job preview-job">
              <div className="job-body">
                <span className="job-title">{form.title || 'Tiêu đề tin của bạn'}</span>
                <div className="job-meta">
                  <span className="salary">{salaryText({ ...form, salaryMin: form.salaryMin || null, salaryMax: form.salaryMax || null })}</span>
                  <span className="chip">{form.location || 'Địa điểm'}</span>
                  <span className="chip">{form.category || 'Ngành nghề'}</span>
                  {workTime && <span className="chip">{workTime}</span>}
                </div>
              </div>
            </article>
          </div>
          <div className="card checklist-card">
            <h2>Tin dễ nhận hồ sơ</h2>
            <ul className="tips">
              <li className={form.title.length >= 10 ? 'ok' : ''}>Tiêu đề nêu rõ vị trí và ca làm</li>
              <li className={form.salaryMin ? 'ok' : ''}>Ghi mức lương cụ thể</li>
              <li className={!checkWorkTime(wt) && workTime ? 'ok' : ''}>Chọn ngày và khung giờ làm việc</li>
              <li className={form.description.length >= 60 ? 'ok' : ''}>Mô tả từ 60 ký tự trở lên</li>
            </ul>
          </div>
        </aside>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
