import { AREAS, AREA_GROUPS, REMOTE, joinArea, splitArea } from '../utils/areas';

// Chọn địa chỉ bằng 2 danh sách xổ xuống: Tỉnh/thành -> Khu vực (dùng ở form đăng tin, hồ sơ nhà tuyển dụng)
export function AreaSelect({ value, onChange, invalid, remote = true, wholeLabel = 'Toàn tỉnh/thành' }) {
  const { province, area } = splitArea(value);
  const p = AREAS.find((x) => x.name === province);
  const legacy = value && !province;   // địa chỉ cũ nhập tay, không khớp danh sách

  return (
    <div className="area-select">
      <select aria-label="Tỉnh/thành" className={invalid ? 'invalid' : ''} value={province}
        onChange={(e) => onChange(joinArea(e.target.value, ''))}>
        <option value="">Chọn tỉnh/thành</option>
        {AREA_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.items.map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}
          </optgroup>
        ))}
        {remote && <option value={REMOTE}>{REMOTE}</option>}
      </select>
      <select aria-label="Khu vực" className={invalid ? 'invalid' : ''} value={area}
        disabled={!p} onChange={(e) => onChange(joinArea(province, e.target.value))}>
        <option value="">{p ? wholeLabel : 'Chọn khu vực'}</option>
        {p?.areas.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      {legacy && <span className="hint">Địa chỉ cũ "{value}" không có trong danh sách, vui lòng chọn lại.</span>}
    </div>
  );
}

// Một danh sách xổ xuống có nhóm theo tỉnh/thành (34 tỉnh/thành), dùng cho bộ lọc ở trang chủ
export function AreaFilter({ value, onChange, className }) {
  return (
    <select aria-label="Địa điểm" className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Tất cả địa điểm</option>
      {AREAS.map((p) => (
        <optgroup key={p.name} label={p.name}>
          <option value={p.name}>{p.name} (tất cả)</option>
          {p.areas.map((a) => <option key={a} value={`${a}, ${p.name}`}>{a}</option>)}
        </optgroup>
      ))}
      <option value={REMOTE}>{REMOTE}</option>
    </select>
  );
}
