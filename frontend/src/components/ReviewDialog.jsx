import { useState } from 'react';
import client, { errorMessage } from '../api/client';
import { Modal } from './ui';

const LEVELS = ['', 'Rất không hài lòng', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

// MH-10 – Hộp thoại đánh giá 1–5 điểm sau khi công việc hoàn thành (PB-13)
// app: đơn ứng tuyển cần đánh giá; who: tên người được đánh giá; onDone(review) khi gửi thành công
export default function ReviewDialog({ app, who, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!rating) { setError('Vui lòng chọn số điểm từ 1 đến 5'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await client.post(`/api/applications/${app.id}/reviews`, { rating, comment: comment.trim() || null });
      onDone(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Đánh giá ${who}`} onClose={onClose} footer={(
      <>
        <button type="button" className="btn link" onClick={onClose}>Để sau</button>
        <button type="button" className="btn primary" disabled={busy} onClick={submit}>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
      </>
    )}>
      <p className="modal-text">Công việc <b>{app.jobTitle}</b> đã hoàn thành. Mỗi bên chỉ đánh giá một lần và không sửa được sau khi gửi.</p>
      <div className="rate-pick" role="radiogroup" aria-label="Số điểm">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n}
            className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>{n}</button>
        ))}
        <span className="rate-text">{rating ? `${rating}/5 – ${LEVELS[rating]}` : 'Chọn điểm từ 1 đến 5'}</span>
      </div>
      <label>Nhận xét <small>(không bắt buộc, tối đa 500 ký tự)</small>
        <textarea rows={4} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Ví dụ: đúng giờ, nhiệt tình, trả lương đúng hẹn..." />
        <small className="count">{comment.length}/500</small>
      </label>
      {error && <p className="alert error">{error}</p>}
    </Modal>
  );
}
