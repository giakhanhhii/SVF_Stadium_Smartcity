function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function ringSvg(pct, label) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 64 64" class="hud-ring">
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="5"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="#00d4ff" stroke-width="5"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 32 32)"/>
    <text x="32" y="29" text-anchor="middle" fill="#7ab0d0" font-size="6">${label}</text>
    <text x="32" y="40" text-anchor="middle" fill="#00d4ff" font-size="12" font-weight="600">${pct}%</text>
  </svg>`;
}

function metricBars(metrics) {
  return `<div class="hud-metric-bars">${metrics.map((m) =>
    `<div class="hud-bar-item" title="${m.label}: ${m.value}">
      <div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
      <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div>
    </div>`,
  ).join('')}</div>`;
}

function lineTrendSvg(bars, className = 'security-soft-line') {
  const max = Math.max(...bars.map((b) => b.value));
  const w = 168;
  const h = 58;
  const step = w / (bars.length - 1);
  const pts = bars.map((b, i) => `${Math.round(i * step)},${Math.round(h - (b.value / max) * (h - 10) - 5)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  const labelX = (i) => Math.min(w - 12, Math.max(12, Math.round(i * step)));
  return `<svg viewBox="0 0 ${w} ${h + 16}" class="${className}" aria-hidden="true">
    <polygon points="${area}"/>
    <polyline points="${pts}"/>
    ${bars.map((b, i) => `<circle cx="${Math.round(i * step)}" cy="${Math.round(h - (b.value / max) * (h - 10) - 5)}" r="2.4"/>`).join('')}
    ${bars.map((b, i) => i === 0 || i === bars.length - 1 || i % 2 === 0
    ? `<text x="${labelX(i)}" y="${h + 12}">${b.time}</text>`
    : '').join('')}
  </svg>`;
}

function blockedVisitorBars(values) {
  const max = Math.max(...values.map((item) => item.value), 1);
  return `<div class="security-blocked-entry">
    <div class="security-blocked-reason">
      <i class="ti ti-id-off"></i>
      <span>Không có thẻ cư dân</span>
      <strong>${values.reduce((sum, item) => sum + item.value, 0)}</strong>
    </div>
    <div class="security-blocked-bars" aria-hidden="true">
      ${values.map((item) => {
        const height = 24 + (item.value / max) * 62;
        return `<span class="security-blocked-bar" title="${item.time}: ${item.value}" style="height:${height.toFixed(0)}%"></span>`;
      }).join('')}
    </div>
    <div class="security-blocked-labels">
      ${values.map((item) => `<span><b>${item.value}</b><em>${item.time}</em></span>`).join('')}
    </div>
  </div>`;
}

const RISK_ZONE_PRESETS = [
  {
    key: 'inner',
    tab: 'Nội khu',
    pct: 74,
    metrics: [
      { label: 'AI cam', value: '96', pct: 79 },
      { label: 'Điểm nóng', value: '04', pct: 48 },
    ],
  },
  {
    key: 'perimeter',
    tab: 'Vành đai',
    pct: 58,
    metrics: [
      { label: 'Cam vành đai', value: '64', pct: 64 },
      { label: 'Điểm mở', value: '07', pct: 56 },
    ],
  },
];

function riskZonePanel(zone, isActive) {
  return `<div class="hud-env-row risk-zone-panel" data-risk-zone-panel="${zone.key}"${isActive ? '' : ' hidden'}>
    ${ringSvg(zone.pct, zone.tab)}
    ${metricBars(zone.metrics)}
  </div>`;
}

export const SMARTCITY_DEVICE_PRESETS = {
  camera: {
    label: 'Camera',
    icon: 'ti-device-cctv',
    quantity: 78,
    status: '72 online · 03 cảnh báo · 03 bảo trì',
    summary: 'Giám sát camera theo khu, ưu tiên điểm nóng và camera có cảnh báo.',
    tones: ['ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','ok','warn','warn','ok','ok','idle','warn'],
    zones: [
      { key: 'A1', label: 'Khu A1', value: '24 cam', note: '01 cảnh báo' },
      { key: 'B2', label: 'Khu B2', value: '31 cam', note: '02 cảnh báo' },
      { key: 'C3', label: 'Khu C3', value: '23 cam', note: 'Ổn định' },
    ],
  },
  gate: {
    label: 'Cổng ra vào',
    icon: 'ti-door',
    quantity: 18,
    status: '15 mở · 02 hạn chế · 01 khóa',
    summary: 'Theo dõi cổng dân cư, cổng hầm và luồng kiểm soát ra vào.',
    tones: ['ok','ok','warn','ok','ok','ok','idle','ok','ok','warn','ok','ok','ok','ok','ok','ok','idle','ok','ok','ok','warn','ok','ok','ok'],
    zones: [
      { key: 'A1', label: 'Cổng A1', value: '6 cổng', note: '01 hạn chế' },
      { key: 'B2', label: 'Cổng B2', value: '7 cổng', note: 'Mở ưu tiên' },
      { key: 'C3', label: 'Cổng C3', value: '5 cổng', note: '01 khóa' },
    ],
  },
  sos: {
    label: 'SOS khẩn cấp',
    icon: 'ti-emergency-bed',
    quantity: 12,
    status: '10 sẵn sàng · 02 đang kiểm tra',
    summary: 'Điểm SOS cư dân, thang máy và bãi xe được giám sát theo ca trực.',
    tones: ['ok','ok','ok','warn','ok','ok','ok','ok','idle','ok','ok','ok','warn','ok','ok','ok','ok','ok','ok','idle','ok','ok','ok','ok'],
    zones: [
      { key: 'A1', label: 'SOS A1', value: '4 trạm', note: 'Sẵn sàng' },
      { key: 'B2', label: 'SOS B2', value: '5 trạm', note: '01 kiểm tra' },
      { key: 'C3', label: 'SOS C3', value: '3 trạm', note: '01 kiểm tra' },
    ],
  },
  ai: {
    label: 'AI giám sát',
    icon: 'ti-brain',
    quantity: 42,
    status: '38 mô hình chạy · 04 cần xác minh',
    summary: 'AI phát hiện tụ tập, vượt rào, khói và hành vi bất thường.',
    tones: ['ok','ok','ok','ok','warn','ok','ok','ok','ok','warn','ok','ok','idle','ok','ok','ok','ok','ok','warn','ok','ok','ok','warn','ok'],
    zones: [
      { key: 'A1', label: 'AI A1', value: '12 rule', note: '01 xác minh' },
      { key: 'B2', label: 'AI B2', value: '16 rule', note: '02 xác minh' },
      { key: 'C3', label: 'AI C3', value: '14 rule', note: '01 xác minh' },
    ],
  },
};

function devicePanel(activeKey = 'camera') {
  const device = SMARTCITY_DEVICE_PRESETS[activeKey] || SMARTCITY_DEVICE_PRESETS.camera;
  const cells = device.tones.map((tone, index) =>
    `<button type="button" class="hud-matrix-cell hud-matrix-cell--${tone}" data-smartcity-device-cell="${index + 1}" aria-label="${device.label} điểm ${index + 1}"></button>`,
  ).join('');
  return `<div class="hud-device-chart" data-smartcity-device-panel data-device-mode="${activeKey}">
    <div class="hud-device-total"><i class="ti ${device.icon}"></i><strong data-smartcity-device-total>${device.quantity}</strong><span data-smartcity-device-status>${device.status}</span></div>
    <p class="hud-device-summary" data-smartcity-device-summary>${device.summary}</p>
    <div class="hud-matrix" data-smartcity-device-matrix>${cells}</div>
    <div class="hud-vent-row hud-device-zones" data-smartcity-device-zones>
      ${device.zones.map((zone) => `<button class="hud-vent-btn" data-smartcity-device-zone="${zone.key}"><b>${zone.key}</b><span>${zone.note}</span></button>`).join('')}
    </div>
  </div>`;
}

function smartcityDeviceModal() {
  return `<div class="smartcity-device-modal" data-smartcity-device-modal hidden>
    <div class="smartcity-device-modal__panel" role="dialog" aria-modal="true" aria-label="Điều khiển thiết bị">
      <button type="button" class="smartcity-modal__close" data-smartcity-device-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-modal__icon"><i class="ti ti-device-desktop-analytics" data-smartcity-device-modal-icon></i></span>
        <div><small data-smartcity-device-modal-tag>DEVICE CONTROL</small><h3 data-smartcity-device-modal-title>Thiết bị khu A1</h3></div>
      </div>
      <p class="smartcity-device-modal__summary" data-smartcity-device-modal-summary>Đang tải trạng thái thiết bị.</p>
      <div class="smartcity-device-modal__grid" data-smartcity-device-modal-stats></div>
      <div class="smartcity-modal__steps" data-smartcity-device-modal-actions>
        <button type="button" data-smartcity-device-modal-action="focus"><b>01</b>Tập trung sơ đồ</button>
        <button type="button" data-smartcity-device-modal-action="check"><b>02</b>Kiểm tra trạng thái</button>
        <button type="button" data-smartcity-device-modal-action="dispatch"><b>03</b>Gửi đội trực</button>
      </div>
      <div class="smartcity-modal__status"><i class="ti ti-activity"></i><span data-smartcity-device-modal-status>Chọn thao tác để cập nhật sơ đồ thiết bị.</span></div>
    </div>
  </div>`;
}

function fireExitCoordinationPanel() {
  return `${evacuationRoutePanel()}${fireSensorTrendPanel()}`;
  const sensors = [
    { label: 'Khói', value: 82, tone: 'hot' },
    { label: 'Nhiệt', value: 68, tone: 'warn' },
    { label: 'Gas', value: 28, tone: 'ok' },
    { label: 'Sprinkler', value: 96, tone: 'ok' },
  ];
  return `<div class="security-fire-exit">
    <div class="security-fire-sensors">
      ${sensors.map((sensor) => `<span class="security-fire-sensor security-fire-sensor--${sensor.tone}">
        <b>${sensor.label}</b>
        <i><em style="height:${sensor.value}%"></em></i>
        <strong>${sensor.value}%</strong>
      </span>`).join('')}
    </div>
    <div class="security-exit-route">
      <div class="security-exit-route__diagram">
        <span class="security-exit-node security-exit-node--hot">B1</span>
        <i class="security-exit-line security-exit-line--warn"></i>
        <span class="security-exit-node">B2</span>
        <i class="security-exit-line"></i>
        <span class="security-exit-node security-exit-node--safe">C1</span>
        <i class="security-exit-line security-exit-line--safe"></i>
        <span class="security-exit-node security-exit-node--safe">Tập kết</span>
      </div>
      <div class="security-exit-status">
        <span><b>03</b><em>Cửa mở</em></span>
        <span><b>02'</b><em>ETA đội</em></span>
        <span><b>1.2k</b><em>người/giờ</em></span>
      </div>
    </div>
  </div>`;
}

function evacuationRoutePanel() {
  return `<section class="hud-block event-route smartcity-fire-route">
    ${hudHead('Điều phối lối thoát')}
    <div class="event-route__diagram">
      <span class="event-route__node event-route__node--hot">B12</span>
      <span class="event-route__line event-route__line--a"></span>
      <span class="event-route__node event-route__node--exit">B2</span>
      <span class="event-route__line event-route__line--b"></span>
      <span class="event-route__node event-route__node--exit">C1</span>
    </div>
    <svg class="event-route-flow" viewBox="0 0 160 38" aria-hidden="true">
      <g class="event-route-flow__grid">
        ${[8, 16, 24, 32].map((y) => `<line x1="4" y1="${y}" x2="156" y2="${y}"/>`).join('')}
      </g>
      <polyline points="6,28 28,22 52,18 76,12 104,16 130,10 154,14"/>
      ${[6, 28, 52, 76, 104, 130, 154].map((x, i) => `<circle cx="${x}" cy="${[28, 22, 18, 12, 16, 10, 14][i]}" r="2"/>`).join('')}
    </svg>
    <p class="smartcity-fire-status" data-smartcity-route-status>Luồng B12 đang ưu tiên thoát qua B2/C1.</p>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-smartcity-route-action="open">
        <i class="ti ti-door-exit"></i><span>Mở B2/C1</span>
      </button>
      <button type="button" class="event-risk__btn" data-smartcity-route-action="reverse">
        <i class="ti ti-arrow-guide"></i><span>Đảo luồng</span>
      </button>
      <button type="button" class="event-risk__btn" data-smartcity-route-action="pa">
        <i class="ti ti-speakerphone"></i><span>PA hướng dẫn</span>
      </button>
    </div>
  </section>`;
}

function fireSensorTrendPanel() {
  const bars = [
    { label: 'Nhiệt', value: 82 },
    { label: 'Khói', value: 64 },
    { label: 'Gas', value: 38 },
    { label: 'Điện', value: 52 },
  ];
  return `<section class="hud-block event-fire-trend event-risk--fire smartcity-fire-sensors">
    ${hudHead('Cảm biến cháy nổ')}
    <div class="event-fire-bars">${bars.map((b) =>
    `<div class="event-fire-bar event-fire-bar--${b.value > 70 ? 'hot' : b.value > 45 ? 'warn' : 'ok'}">
      <span>${b.label}</span><div class="event-fire-bar__track"><i style="height:${b.value}%"></i></div><b>${b.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-fire-auto">
      <button type="button" class="event-fire-auto__button" data-smartcity-fire-auto aria-label="Kích hoạt dây chuyền chống cháy">
        <i class="ti ti-shield-bolt"></i>
        <span>Auto PCCC</span>
      </button>
      <p data-smartcity-fire-status>Kích hoạt dây chuyền chống cháy</p>
    </div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-smartcity-fire-action="alarm">
        <i class="ti ti-flame"></i><span>Báo cháy</span>
      </button>
      <button type="button" class="event-risk__btn" data-smartcity-fire-action="smoke">
        <i class="ti ti-wind"></i><span>Hút khói</span>
      </button>
      <button type="button" class="event-risk__btn" data-smartcity-fire-action="power">
        <i class="ti ti-power"></i><span>Cắt điện</span>
      </button>
    </div>
  </section>`;
}

const SMARTCITY_FIRE_EXIT_ACTIONS = {
  open: {
    icon: 'ti-door-exit',
    tag: 'ĐIỀU PHỐI LỐI THOÁT',
    title: 'Mở B2/C1',
    summary: 'Mở hai lối B2 và C1 để nhận dòng thoát từ B12, giữ hành lang ưu tiên cho cư dân và đội an ninh.',
    route: ['B12', 'B2', 'C1'],
    stats: [['2 lối', 'Mở'], ['04 phút', 'ETA giảm tải'], ['1.2k/h', 'Năng lực thoát']],
    steps: ['Mở khóa kiểm soát B2/C1', 'Điều đội an ninh giữ mép luồng', 'Theo dõi camera B12 trong 5 phút'],
    status: 'Chờ xác nhận mở B2/C1.',
    done: 'Đã mở B2/C1 và ưu tiên dòng người từ B12 sang hai lối thoát.',
    primary: 'Kích hoạt mở lối',
  },
  reverse: {
    icon: 'ti-arrow-guide',
    tag: 'ĐẢO LUỒNG',
    title: 'Đảo luồng phụ',
    summary: 'Khóa nhánh quay lại B12, đảo hướng dòng phụ và ưu tiên tuyến C1 để giảm áp lực khu đông.',
    route: ['B12', 'C1', 'PA'],
    stats: [['1 luồng', 'Đảo chiều'], ['3 chốt', 'Khóa nhánh'], ['C1', 'Tuyến chính']],
    steps: ['Đảo chiều luồng phụ', 'Khóa điểm quay lại B12', 'Cập nhật PA và biển chỉ hướng C1'],
    status: 'Chờ xác nhận đảo luồng.',
    done: 'Đã đảo luồng phụ, khóa nhánh quay lại B12 và ưu tiên tuyến C1.',
    primary: 'Kích hoạt đảo luồng',
  },
  pa: {
    icon: 'ti-speakerphone',
    tag: 'PA HƯỚNG DẪN',
    title: 'PA hướng dẫn B12',
    summary: 'Phát hướng dẫn rời B12 theo hai tuyến B2/C1, nhắc không dừng lại ở hành lang hẹp.',
    route: ['VOC', 'PA B12', 'B2/C1'],
    stats: [['3 lần', 'Phát PA'], ['45 giây', 'Chu kỳ'], ['B/C', 'Vùng loa']],
    steps: ['Chọn loa PA B12 và hành lang B/C', 'Phát kịch bản hướng dẫn thoát', 'Lặp lại nếu mật độ chưa giảm'],
    status: 'Chờ xác nhận phát PA.',
    done: 'Đã phát PA hướng dẫn rời B12 theo hai tuyến B2/C1.',
    primary: 'Phát PA',
  },
  alarm: {
    icon: 'ti-flame',
    tag: 'PCCC',
    title: 'Báo cháy nội khu',
    summary: 'Gửi cảnh báo PCCC tới ca trực, bảo vệ tầng và đội phản ứng nhanh tại khu nguy cơ.',
    route: ['Cảm biến', 'PCCC', 'Đội ứng phó'],
    stats: [['82%', 'Nhiệt'], ['64%', 'Khói'], ['2 phút', 'ETA đội']],
    steps: ['Gửi báo cháy tới ca trực PCCC', 'Ghim camera khu nguy cơ', 'Chuẩn bị sơ tán mềm qua B2/C1'],
    status: 'Chờ xác nhận báo cháy.',
    done: 'Đã gửi báo cháy nội khu và chuyển ca trực PCCC sang trạng thái tiếp nhận.',
    primary: 'Gửi báo cháy',
  },
  smoke: {
    icon: 'ti-wind',
    tag: 'HÚT KHÓI',
    title: 'Hút khói khu nguy cơ',
    summary: 'Khởi động quạt hút khói, tạo áp âm hành lang và theo dõi lại cảm biến khói trong 60 giây.',
    route: ['Khói', 'Quạt hút', 'Hành lang'],
    stats: [['64%', 'Khói'], ['60 giây', 'Theo dõi'], ['3 quạt', 'Kích hoạt']],
    steps: ['Mở quạt hút khói', 'Tạo áp âm hành lang', 'Theo dõi cảm biến khói sau kích hoạt'],
    status: 'Chờ xác nhận hút khói.',
    done: 'Đã mở hút khói, theo dõi cảm biến khói trong 60 giây.',
    primary: 'Mở hút khói',
  },
  power: {
    icon: 'ti-power',
    tag: 'CẮT ĐIỆN',
    title: 'Cắt điện khu nguy cơ',
    summary: 'Cắt điện vùng nguy cơ nhưng giữ nguồn ưu tiên cho camera, PA và đèn thoát hiểm.',
    route: ['BMS', 'Khu nguy cơ', 'Nguồn ưu tiên'],
    stats: [['1 vùng', 'Cắt điện'], ['3 hệ', 'Giữ nguồn'], ['BMS', 'Ghi log']],
    steps: ['Cắt điện khu nguy cơ', 'Giữ camera, PA và đèn thoát hiểm', 'Ghi log BMS cho ca trực'],
    status: 'Chờ xác nhận cắt điện.',
    done: 'Đã cắt điện khu nguy cơ và giữ nguồn cho camera, PA, đèn thoát hiểm.',
    primary: 'Cắt điện',
  },
  auto: {
    icon: 'ti-shield-bolt',
    tag: 'AUTO PCCC',
    title: 'Kích hoạt Auto PCCC',
    summary: 'Chạy chuỗi tự động: cắt điện khu nguy cơ, mở hút khói, gửi báo cháy và ưu tiên lối thoát B2/C1.',
    route: ['PCCC', 'BMS', 'B2/C1'],
    stats: [['4 bước', 'Tự động'], ['2 lối', 'Ưu tiên'], ['60 giây', 'Theo dõi']],
    steps: ['Cắt điện khu nguy cơ', 'Mở hút khói', 'Gửi báo cháy', 'Ưu tiên thoát B2/C1'],
    status: 'Chờ xác nhận Auto PCCC.',
    done: 'Auto PCCC đã kích hoạt cho khu nguy cơ.',
    primary: 'Kích hoạt Auto PCCC',
  },
};

function smartcityFireExitModal() {
  return `<div class="smartcity-action-modal" data-smartcity-action-modal hidden>
    <div class="smartcity-action-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối Smart City">
      <button type="button" class="smartcity-action-modal__close" data-smartcity-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-action-modal__head">
        <span class="smartcity-action-modal__icon"><i class="ti ti-door-exit" data-smartcity-action-icon></i></span>
        <div><small data-smartcity-action-tag>ĐIỀU PHỐI</small><h3 data-smartcity-action-title>Mở B2/C1</h3></div>
      </div>
      <p data-smartcity-action-summary></p>
      <div class="smartcity-action-modal__route" data-smartcity-action-route></div>
      <div class="smartcity-action-modal__stats" data-smartcity-action-stats></div>
      <div class="smartcity-action-modal__steps" data-smartcity-action-steps></div>
      <div class="smartcity-action-modal__status"><i class="ti ti-broadcast"></i><span data-smartcity-action-status>Chờ xác nhận điều phối.</span></div>
      <button type="button" class="smartcity-action-modal__primary" data-smartcity-action-confirm>
        <i class="ti ti-send"></i><span data-smartcity-action-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

const SMARTCITY_POWER_ZONES = ['IOC', 'Khu căn hộ A', 'Khu căn hộ B', 'TMDV', 'Hầm xe', 'Công viên', 'Trạm bơm', 'Cổng B2'];

function smartcityFireControlModals() {
  const zoneItems = SMARTCITY_POWER_ZONES.map((name, index) =>
    `<button type="button" class="smartcity-power-zone smartcity-power-zone--on${index === 3 || index === 5 ? ' smartcity-power-zone--focus' : ''}" data-smartcity-power-zone="${name}">
      <i></i><b>${name}</b>
    </button>`,
  ).join('');
  return `<div class="smartcity-smoke-modal" data-smartcity-smoke-modal hidden>
    <div class="smartcity-smoke-modal__panel" role="dialog" aria-modal="true" aria-label="Hút khói">
      <button type="button" class="smartcity-modal__close" data-smartcity-smoke-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-modal__icon"><i class="ti ti-wind"></i></span>
        <div><small>SMOKE EXTRACT</small><h3>Hút khói khu nguy cơ</h3></div>
      </div>
      <div class="smartcity-smoke-gauge">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r="52"></circle>
          <circle data-smartcity-smoke-ring cx="70" cy="70" r="52"></circle>
        </svg>
        <strong><span data-smartcity-smoke-pct>0</span>%</strong>
      </div>
      <p data-smartcity-smoke-status>Đang khởi động quạt hút khói và mở tuyến thoát khí.</p>
      <div class="smartcity-modal__steps">
        <span><b>01</b>Khu TMDV hút khói</span><span><b>02</b>Áp âm hành lang</span><span><b>03</b>Theo dõi cảm biến</span>
      </div>
    </div>
  </div>
  <div class="smartcity-power-modal" data-smartcity-power-modal hidden>
    <div class="smartcity-power-modal__panel" role="dialog" aria-modal="true" aria-label="Cắt điện toàn thành phố">
      <button type="button" class="smartcity-modal__close" data-smartcity-power-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head smartcity-power-modal__head">
        <span class="smartcity-power-button" data-smartcity-power-toggle><i class="ti ti-power"></i></span>
        <div><small data-smartcity-power-tag>POWER CONTROL</small><h3 data-smartcity-power-title>Cắt điện toàn thành phố</h3></div>
      </div>
      <p data-smartcity-power-message>Bạn có chắc chắn muốn cắt điện? Điều này sẽ cắt điện toàn thành phố, chia theo từng khu để giữ nguồn ưu tiên.</p>
      <div class="smartcity-power-zones">${zoneItems}</div>
      <div class="smartcity-modal__status"><i class="ti ti-bolt"></i><span data-smartcity-power-status>Chờ xác nhận thao tác nguồn.</span></div>
    </div>
  </div>
  <div class="smartcity-dispatch-modal" data-smartcity-dispatch-modal hidden>
    <div class="smartcity-dispatch-modal__panel" role="dialog" aria-modal="true" aria-label="Gọi Y tế / Cứu hỏa">
      <button type="button" class="smartcity-modal__close" data-smartcity-dispatch-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-dispatch-icon"><i class="ti ti-phone-call"></i></span>
        <div><small>VOC EMERGENCY DISPATCH</small><h3>Gọi Y tế / Cứu hỏa</h3></div>
      </div>
      <strong class="smartcity-dispatch-label">Ưu tiên 1 · Chọn tổng đài gọi ngay</strong>
      <div class="smartcity-dispatch-options">
        <button type="button" data-smartcity-dispatch-option="115"><i class="ti ti-first-aid-kit"></i><span>Y tế khẩn cấp</span><b>115 · VOC-11</b></button>
        <button type="button" class="smartcity-dispatch-option--active" data-smartcity-dispatch-option="114"><i class="ti ti-flame"></i><span>Cứu hỏa / sơ tán</span><b>114 · VOC-12</b></button>
      </div>
      <div class="smartcity-dispatch-ready">
        <i class="ti ti-phone-call"></i>
        <span><em>Sẵn sàng gọi</em><strong data-smartcity-dispatch-line>114 · VOC-12</strong><b data-smartcity-dispatch-type>Cứu hỏa / sơ tán</b></span>
        <small>CHỜ GỌI</small>
      </div>
      <label class="smartcity-dispatch-note">
        <span>Vấn đề cần hỗ trợ</span>
        <textarea data-smartcity-dispatch-note placeholder="Ví dụ: Khu TMDV có khói, cần hỗ trợ cứu hỏa và sơ tán."></textarea>
      </label>
      <div class="smartcity-dispatch-record"><b>Tùy chọn 2</b><button type="button"><i class="ti ti-microphone"></i>Ghi âm mô tả</button><span>Chưa ghi âm</span></div>
      <div class="smartcity-modal__status"><i class="ti ti-phone-call"></i><span data-smartcity-dispatch-status>Đã chọn 114 · VOC-12. Bấm icon điện thoại để gọi. Ghi âm là tùy chọn nếu cần mô tả thêm.</span></div>
      <button type="button" class="smartcity-dispatch-submit" data-smartcity-dispatch-submit><i class="ti ti-send"></i>Kết thúc & gửi yêu cầu</button>
    </div>
  </div>`;
}

export function renderRightSidebar(d) {
  const envTabs = RISK_ZONE_PRESETS.map((zone, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}" data-risk-zone="${zone.key}">${zone.tab}</button>`,
  ).join('');

  const deviceTabs = Object.entries(SMARTCITY_DEVICE_PRESETS).map(([key, item], i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}" data-smartcity-device-tab="${key}">${item.label}</button>`,
  ).join('');

  return `
    <section class="hud-block hud-block--risk-zone">${hudHead(d.environment.title)}
      <div class="hud-tabs" data-risk-zone-tabs>${envTabs}</div>
      ${RISK_ZONE_PRESETS.map((zone, index) => riskZonePanel(zone, index === 0)).join('')}
    </section>
    ${fireExitCoordinationPanel()}
    ${smartcityFireExitModal()}
    ${smartcityFireControlModals()}
    <section class="hud-block">${hudHead('Khách quá hạn')}
      <p class="hud-sub security-overdue-note">Lượt khách chưa checkout khỏi khu an ninh</p>
      ${lineTrendSvg([
        { time: '16h', value: 4 },
        { time: '17h', value: 6 },
        { time: '18h', value: 8 },
        { time: '19h', value: 11 },
        { time: '20h', value: 13 },
        { time: 'Hiện', value: 15 },
      ])}
    </section>
    <section class="hud-block hud-block--blocked-visitors">${hudHead('Khách bị chặn vào khu')}
      ${blockedVisitorBars([
        { time: '22h', value: 5 },
        { time: '23h', value: 8 },
        { time: '0h', value: 11 },
        { time: '2h', value: 14 },
        { time: '4h', value: 9 },
        { time: '6h', value: 6 },
        { time: '7h', value: 4 },
      ])}
    </section>
    `;
}

let riskZoneTabsBound = false;

export function bindRiskZoneTabs(root = document) {
  const updateRiskZone = (scope, zoneKey) => {
    scope.querySelectorAll('[data-risk-zone-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.riskZonePanel !== zoneKey;
    });
  };

  root.querySelectorAll('[data-risk-zone-tabs]').forEach((tabsRoot) => {
    const activeTab = tabsRoot.querySelector('.hud-tab--active[data-risk-zone]') || tabsRoot.querySelector('[data-risk-zone]');
    if (activeTab?.dataset.riskZone) updateRiskZone(root, activeTab.dataset.riskZone);
  });

  if (riskZoneTabsBound) return;
  riskZoneTabsBound = true;

  root.addEventListener('click', (event) => {
    const tab = event.target.closest?.('[data-risk-zone]');
    if (!tab || !root.contains(tab)) return;
    updateRiskZone(root, tab.dataset.riskZone);
  });
}

let smartcityDeviceControlsBound = false;

export function bindSmartcityDeviceControls(root = document) {
  const renderDeviceMode = (modeKey, focusZone = '') => {
    const device = SMARTCITY_DEVICE_PRESETS[modeKey] || SMARTCITY_DEVICE_PRESETS.camera;
    const panel = document.querySelector('[data-smartcity-device-panel]');
    if (!panel) return;
    panel.dataset.deviceMode = modeKey;
    panel.dataset.focusZone = focusZone;
    panel.querySelector('.hud-device-total i').className = `ti ${device.icon}`;
    panel.querySelector('[data-smartcity-device-total]').textContent = device.quantity;
    panel.querySelector('[data-smartcity-device-status]').textContent = device.status;
    panel.querySelector('[data-smartcity-device-summary]').textContent = device.summary;
    panel.querySelector('[data-smartcity-device-matrix]').innerHTML = device.tones.map((tone, index) => {
      const zoneIndex = index % device.zones.length;
      const active = focusZone && device.zones[zoneIndex]?.key === focusZone;
      return `<button type="button" class="hud-matrix-cell hud-matrix-cell--${tone}${active ? ' hud-matrix-cell--focus' : ''}" data-smartcity-device-cell="${index + 1}" aria-label="${device.label} điểm ${index + 1}"></button>`;
    }).join('');
    panel.querySelector('[data-smartcity-device-zones]').innerHTML = device.zones.map((zone) =>
      `<button class="hud-vent-btn${focusZone === zone.key ? ' hud-vent-btn--active' : ''}" data-smartcity-device-zone="${zone.key}"><b>${zone.key}</b><span>${zone.note}</span></button>`,
    ).join('');
    document.querySelectorAll('[data-smartcity-device-tab]').forEach((tab) => {
      tab.classList.toggle('hud-tab--active', tab.dataset.smartcityDeviceTab === modeKey);
    });
  };

  const openDeviceModal = ({ modeKey = 'camera', zoneKey = '', cellIndex = '' } = {}) => {
    const device = SMARTCITY_DEVICE_PRESETS[modeKey] || SMARTCITY_DEVICE_PRESETS.camera;
    const zone = device.zones.find((item) => item.key === zoneKey) || device.zones[(Number(cellIndex || 1) - 1) % device.zones.length] || device.zones[0];
    const modal = document.querySelector('[data-smartcity-device-modal]');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.dataset.deviceMode = modeKey;
    modal.dataset.deviceZone = zone.key;
    modal.querySelector('[data-smartcity-device-modal-icon]').className = `ti ${device.icon}`;
    modal.querySelector('[data-smartcity-device-modal-tag]').textContent = device.label.toUpperCase();
    modal.querySelector('[data-smartcity-device-modal-title]').textContent = `${device.label} · ${zone.label}`;
    modal.querySelector('[data-smartcity-device-modal-summary]').textContent = `${device.summary} Đang ưu tiên ${zone.label}.`;
    modal.querySelector('[data-smartcity-device-modal-stats]').innerHTML = `
      <span><b>${zone.value}</b><em>Thiết bị</em></span>
      <span><b>${zone.note}</b><em>Trạng thái</em></span>
      <span><b>${cellIndex ? `Điểm ${cellIndex}` : zone.key}</b><em>Đang chọn</em></span>`;
    modal.querySelector('[data-smartcity-device-modal-status]').textContent = `Đã chọn ${zone.label}. Sơ đồ bên phải đang tập trung vào khu này.`;
    renderDeviceMode(modeKey, zone.key);
    modal.hidden = false;
  };

  if (smartcityDeviceControlsBound) return;
  smartcityDeviceControlsBound = true;

  root.addEventListener('click', (event) => {
    const deviceTab = event.target.closest?.('[data-smartcity-device-tab]');
    if (deviceTab && root.contains(deviceTab)) {
      renderDeviceMode(deviceTab.dataset.smartcityDeviceTab || 'camera');
      return;
    }

    const zoneBtn = event.target.closest?.('[data-smartcity-device-zone]');
    if (zoneBtn && root.contains(zoneBtn)) {
      const panel = zoneBtn.closest('[data-smartcity-device-panel]');
      openDeviceModal({ modeKey: panel?.dataset.deviceMode || 'camera', zoneKey: zoneBtn.dataset.smartcityDeviceZone });
      return;
    }

    const cellBtn = event.target.closest?.('[data-smartcity-device-cell]');
    if (cellBtn && root.contains(cellBtn)) {
      const panel = cellBtn.closest('[data-smartcity-device-panel]');
      openDeviceModal({ modeKey: panel?.dataset.deviceMode || 'camera', cellIndex: cellBtn.dataset.smartcityDeviceCell });
    }
  });

  document.addEventListener('click', (event) => {
    const modal = document.querySelector('[data-smartcity-device-modal]:not([hidden])');
    if (!modal) return;
    if (event.target.closest('[data-smartcity-device-close]') || event.target === modal) {
      modal.hidden = true;
      return;
    }
    const action = event.target.closest('[data-smartcity-device-modal-action]');
    if (!action) return;
    const modeKey = modal.dataset.deviceMode || 'camera';
    const zoneKey = modal.dataset.deviceZone || 'A1';
    const status = modal.querySelector('[data-smartcity-device-modal-status]');
    renderDeviceMode(modeKey, zoneKey);
    if (status) {
      const messages = {
        focus: `Đã tập trung sơ đồ vào ${zoneKey}.`,
        check: `Đang kiểm tra lại trạng thái ${zoneKey}, dữ liệu đã làm mới trên ma trận.`,
        dispatch: `Đã gửi đội trực tới ${zoneKey} và ghim khu này trên sơ đồ.`,
      };
      status.textContent = messages[action.dataset.smartcityDeviceModalAction] || `Đã cập nhật ${zoneKey}.`;
    }
  });
}

let smartcityFireExitBound = false;

export function bindSmartcityFireExitControls(root = document) {
  if (smartcityFireExitBound) return;
  smartcityFireExitBound = true;

  const routeMessages = {
    open: 'Đã mở B2/C1 và ưu tiên dòng người từ B12 sang hai lối thoát.',
    reverse: 'Đã đảo luồng phụ, khóa nhánh quay lại B12 và ưu tiên tuyến C1.',
    pa: 'Đã phát PA hướng dẫn rời B12 theo hai tuyến B2/C1.',
  };
  const fireMessages = {
    alarm: 'Đã gửi báo cháy nội khu và chuyển ca trực PCCC sang trạng thái tiếp nhận.',
    smoke: 'Đã mở hút khói, theo dõi cảm biến khói trong 60 giây.',
    power: 'Đã cắt điện khu nguy cơ và giữ nguồn cho camera, PA, đèn thoát hiểm.',
  };
  const openSmartcityActionModal = (actionKey) => {
    const action = SMARTCITY_FIRE_EXIT_ACTIONS[actionKey] || SMARTCITY_FIRE_EXIT_ACTIONS.open;
    const modal = root.querySelector('[data-smartcity-action-modal]') || document.querySelector('[data-smartcity-action-modal]');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.dataset.actionKey = actionKey;
    modal.querySelector('[data-smartcity-action-icon]').className = `ti ${action.icon}`;
    modal.querySelector('[data-smartcity-action-tag]').textContent = action.tag;
    modal.querySelector('[data-smartcity-action-title]').textContent = action.title;
    modal.querySelector('[data-smartcity-action-summary]').textContent = action.summary;
    modal.querySelector('[data-smartcity-action-primary]').textContent = action.primary;
    modal.querySelector('[data-smartcity-action-status]').textContent = action.status;
    modal.querySelector('[data-smartcity-action-route]').innerHTML = action.route
      .map((item, index) => `${index ? '<i></i>' : ''}<span>${item}</span>`)
      .join('');
    modal.querySelector('[data-smartcity-action-stats]').innerHTML = action.stats
      .map(([value, label]) => `<span><b>${value}</b><em>${label}</em></span>`)
      .join('');
    modal.querySelector('[data-smartcity-action-steps]').innerHTML = action.steps
      .map((step, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b>${step}</span>`)
      .join('');
    modal.hidden = false;
  };
  const applySmartcityAction = (actionKey) => {
    const action = SMARTCITY_FIRE_EXIT_ACTIONS[actionKey] || SMARTCITY_FIRE_EXIT_ACTIONS.open;
    if (['open', 'reverse', 'pa'].includes(actionKey)) {
      const panel = document.querySelector('.smartcity-fire-route');
      const status = panel?.querySelector('[data-smartcity-route-status]');
      if (status) status.textContent = action.done;
      panel?.querySelectorAll('[data-smartcity-route-action]').forEach((button) => {
        button.classList.toggle('event-risk__btn--hot', button.dataset.smartcityRouteAction === actionKey);
      });
      return;
    }
    const panel = document.querySelector('.smartcity-fire-sensors');
    const status = panel?.querySelector('[data-smartcity-fire-status]');
    if (status) status.textContent = action.done;
    panel?.querySelectorAll('[data-smartcity-fire-action]').forEach((button) => {
      button.classList.toggle('event-risk__btn--hot', button.dataset.smartcityFireAction === actionKey);
    });
    if (actionKey === 'auto') panel?.querySelector('[data-smartcity-fire-auto]')?.classList.add('event-fire-auto__button--done');
  };
  const powerModal = root.querySelector('[data-smartcity-power-modal]');
  const smokeModal = root.querySelector('[data-smartcity-smoke-modal]');
  const dispatchModal = root.querySelector('[data-smartcity-dispatch-modal]');
  const powerState = {
    on: true,
    zones: SMARTCITY_POWER_ZONES.map((name) => ({ name, on: true })),
  };
  let smokeTimer = null;

  const showModal = (modal) => {
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.hidden = false;
  };
  const hideModal = (modal) => {
    if (modal) modal.hidden = true;
  };
  const renderPowerZones = () => {
    powerModal?.querySelectorAll('[data-smartcity-power-zone]').forEach((node) => {
      const zone = powerState.zones.find((item) => item.name === node.dataset.smartcityPowerZone);
      node.classList.toggle('smartcity-power-zone--on', !!zone?.on);
      node.classList.toggle('smartcity-power-zone--off', !zone?.on);
    });
  };
  const preparePowerModal = ({ turnOn = false, zoneName = '', auto = false } = {}) => {
    showModal(powerModal);
    if (!powerModal) return;
    powerModal.dataset.powerIntent = turnOn ? 'on' : 'off';
    powerModal.dataset.powerZone = zoneName;
    powerModal.querySelector('[data-smartcity-power-title]').textContent = zoneName
      ? `${turnOn ? 'Mở điện' : 'Cắt điện'} ${zoneName}`
      : `${turnOn ? 'Mở điện' : 'Cắt điện'} toàn thành phố`;
    powerModal.querySelector('[data-smartcity-power-message]').textContent = zoneName
      ? `Bạn có chắc muốn ${turnOn ? 'mở điện lại' : 'cắt điện'} ${zoneName}? Thao tác này chỉ áp dụng cho khu được chọn.`
      : turnOn
        ? 'Bạn có chắc muốn mở điện toàn thành phố? Các khu sẽ được cấp điện lại theo từng bước.'
        : 'Bạn có chắc chắn muốn cắt điện? Điều này sẽ cắt điện toàn thành phố, chia theo từng khu để giữ nguồn ưu tiên.';
    powerModal.querySelector('[data-smartcity-power-status]').textContent = auto
      ? 'Đang cắt điện toàn thành phố...'
      : zoneName ? `Chờ xác nhận thao tác nguồn cho ${zoneName}.` : 'Chờ xác nhận thao tác nguồn.';
    renderPowerZones();
  };
  const runPowerSequence = (turnOn = false, zoneName = '') => new Promise((resolve) => {
    if (!powerModal) {
      resolve();
      return;
    }
    const zones = zoneName ? powerState.zones.filter((item) => item.name === zoneName) : powerState.zones;
    const status = powerModal.querySelector('[data-smartcity-power-status]');
    let index = 0;
    const tick = () => {
      const zone = zones[index];
      if (!zone) {
        powerState.on = powerState.zones.some((item) => item.on);
        renderPowerZones();
        if (status) status.textContent = turnOn
          ? `Đã mở điện ${zoneName || 'toàn thành phố'}.`
          : `Đã cắt điện ${zoneName || 'toàn thành phố'}. Nguồn ưu tiên vẫn hoạt động.`;
        resolve();
        return;
      }
      zone.on = turnOn;
      renderPowerZones();
      if (status) status.textContent = turnOn ? `Đang mở điện ${zone.name}...` : `Đang cắt điện ${zone.name}...`;
      index += 1;
      window.setTimeout(tick, 170);
    };
    tick();
  });
  const setSmokePct = (pct) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const ring = smokeModal?.querySelector('[data-smartcity-smoke-ring]');
    const pctEl = smokeModal?.querySelector('[data-smartcity-smoke-pct]');
    const status = smokeModal?.querySelector('[data-smartcity-smoke-status]');
    if (pctEl) pctEl.textContent = String(clamped);
    if (ring) {
      const circ = 2 * Math.PI * 52;
      ring.style.strokeDasharray = String(circ);
      ring.style.strokeDashoffset = String(circ * (1 - clamped / 100));
    }
    if (status) status.textContent = clamped >= 100
      ? 'Đã hút khói khu nguy cơ, cảm biến đang trở về ngưỡng an toàn.'
      : 'Đang hút khói, quạt áp lực và cảm biến khói đang cập nhật theo thời gian thực.';
  };
  const startSmokeExtraction = () => new Promise((resolve) => {
    showModal(smokeModal);
    if (smokeTimer) window.clearInterval(smokeTimer);
    setSmokePct(0);
    smokeTimer = window.setInterval(() => {
      const current = Number(smokeModal?.querySelector('[data-smartcity-smoke-pct]')?.textContent || 0);
      const next = current + 11;
      setSmokePct(next);
      if (next >= 100) {
        window.clearInterval(smokeTimer);
        smokeTimer = null;
        resolve();
      }
    }, 160);
  });
  const triggerDispatchCall = (modal) => {
    if (!modal || modal.hidden) return;
    const readyCall = modal.querySelector('.smartcity-dispatch-ready');
    if (!readyCall || readyCall.classList.contains('smartcity-dispatch-ready--calling')) return;
    const line = modal.querySelector('[data-smartcity-dispatch-line]')?.textContent.trim() || '114 · VOC-12';
    const status = modal.querySelector('[data-smartcity-dispatch-status]');
    const badge = readyCall.querySelector('small');
    readyCall.classList.remove('smartcity-dispatch-ready--connected');
    readyCall.classList.add('smartcity-dispatch-ready--calling');
    if (badge) badge.textContent = 'ĐANG GỌI';
    if (status) status.textContent = `Đang gọi ${line}...`;
    window.setTimeout(() => {
      if (modal.hidden) return;
      readyCall.classList.remove('smartcity-dispatch-ready--calling');
      readyCall.classList.add('smartcity-dispatch-ready--connected');
      if (badge) badge.textContent = 'ĐÃ GỌI';
      if (status) status.textContent = `Cuộc gọi đã kết nối với ${line}. Bấm Kết thúc & gửi yêu cầu trong form.`;
    }, 1400);
  };
  const openDispatchModal = ({ auto = false } = {}) => {
    showModal(dispatchModal);
    if (!dispatchModal) return;
    const status = dispatchModal.querySelector('[data-smartcity-dispatch-status]');
    const note = dispatchModal.querySelector('[data-smartcity-dispatch-note]');
    const ready = dispatchModal.querySelector('.smartcity-dispatch-ready');
    const readyBadge = ready?.querySelector('small');
    ready?.classList.remove('smartcity-dispatch-ready--calling', 'smartcity-dispatch-ready--connected');
    if (readyBadge) readyBadge.textContent = 'CHỜ GỌI';
    dispatchModal.querySelectorAll('[data-smartcity-dispatch-option]').forEach((option) => {
      option.classList.toggle('smartcity-dispatch-option--active', option.dataset.smartcityDispatchOption === '114');
    });
    dispatchModal.querySelector('[data-smartcity-dispatch-line]').textContent = '114 · VOC-12';
    dispatchModal.querySelector('[data-smartcity-dispatch-type]').textContent = 'Cứu hỏa / sơ tán';
    if (note && auto) note.value = 'Auto PCCC: đã cắt điện toàn thành phố, đã hút khói khu nguy cơ, yêu cầu cứu hỏa / sơ tán xác nhận tiếp nhận.';
    if (status) status.textContent = auto
      ? 'Đã chọn 114 · VOC-12 từ Auto PCCC. Sẵn sàng gọi cứu hỏa / sơ tán.'
      : 'Đã chọn 114 · VOC-12. Bấm icon điện thoại để gọi. Ghi âm là tùy chọn nếu cần mô tả thêm.';
    if (auto) window.setTimeout(() => triggerDispatchCall(dispatchModal), 220);
  };
  const startAutoPcccChain = async (button) => {
    if (!button || button.dataset.running === 'true') return;
    const status = document.querySelector('[data-smartcity-fire-status]');
    button.dataset.running = 'true';
    button.classList.add('event-fire-auto__button--running');
    if (status) status.textContent = '01 · Đang cắt điện toàn thành phố';
    preparePowerModal({ turnOn: false, auto: true });
    await runPowerSequence(false);
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    hideModal(powerModal);
    if (status) status.textContent = '02 · Đang mở hút khói khu nguy cơ';
    await startSmokeExtraction();
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    hideModal(smokeModal);
    if (status) status.textContent = '03 · Đang gọi y tế / cứu hỏa';
    openDispatchModal({ auto: true });
    const dispatchStatus = dispatchModal?.querySelector('[data-smartcity-dispatch-status]');
    if (dispatchStatus) dispatchStatus.textContent = 'Sẵn sàng gọi 114 · VOC-12. Bấm Kết thúc & gửi yêu cầu trong form.';
    if (status) status.textContent = 'Đã cắt điện toàn thành phố, hút khói và mở yêu cầu y tế / cứu hỏa.';
    button.classList.remove('event-fire-auto__button--running');
    button.classList.add('event-fire-auto__button--done');
    button.dataset.running = 'false';
  };

  root.addEventListener('click', (event) => {
    const routeBtn = event.target.closest?.('[data-smartcity-route-action]');
    if (routeBtn && root.contains(routeBtn)) {
      openSmartcityActionModal(routeBtn.dataset.smartcityRouteAction || 'open');
      return;
    }

    const autoBtn = event.target.closest?.('[data-smartcity-fire-auto]');
    if (autoBtn && root.contains(autoBtn)) {
      startAutoPcccChain(autoBtn);
      return;
    }

    const fireBtn = event.target.closest?.('[data-smartcity-fire-action]');
    if (!fireBtn || !root.contains(fireBtn)) return;
    if (fireBtn.dataset.smartcityFireAction === 'power') {
      preparePowerModal({ turnOn: false });
      return;
    }
    if (fireBtn.dataset.smartcityFireAction === 'smoke') {
      startSmokeExtraction();
      return;
    }
    openDispatchModal();
  });

  document.addEventListener('click', (event) => {
    const activeSmokeModal = document.querySelector('[data-smartcity-smoke-modal]:not([hidden])');
    if (activeSmokeModal && (event.target.closest('[data-smartcity-smoke-close]') || event.target === activeSmokeModal)) {
      activeSmokeModal.hidden = true;
      if (smokeTimer) window.clearInterval(smokeTimer);
      smokeTimer = null;
      return;
    }

    const activePowerModal = document.querySelector('[data-smartcity-power-modal]:not([hidden])');
    if (activePowerModal) {
      if (event.target.closest('[data-smartcity-power-close]') || event.target === activePowerModal) {
        activePowerModal.hidden = true;
        return;
      }
      if (event.target.closest('[data-smartcity-power-toggle]')) {
        preparePowerModal({ turnOn: !powerState.on });
        return;
      }
      const zoneNode = event.target.closest('[data-smartcity-power-zone]');
      if (zoneNode) {
        const zone = powerState.zones.find((item) => item.name === zoneNode.dataset.smartcityPowerZone);
        preparePowerModal({ turnOn: !zone?.on, zoneName: zoneNode.dataset.smartcityPowerZone });
        runPowerSequence(!zone?.on, zoneNode.dataset.smartcityPowerZone);
        return;
      }
    }

    const activeDispatchModal = document.querySelector('[data-smartcity-dispatch-modal]:not([hidden])');
    if (activeDispatchModal) {
      if (event.target.closest('[data-smartcity-dispatch-close]') || event.target === activeDispatchModal) {
        activeDispatchModal.hidden = true;
        return;
      }
      const readyCall = event.target.closest('.smartcity-dispatch-ready');
      if (readyCall && activeDispatchModal.contains(readyCall)) {
        triggerDispatchCall(activeDispatchModal);
        return;
      }
      const option = event.target.closest('[data-smartcity-dispatch-option]');
      if (option) {
        const isFire = option.dataset.smartcityDispatchOption === '114';
        const ready = activeDispatchModal.querySelector('.smartcity-dispatch-ready');
        const badge = ready?.querySelector('small');
        activeDispatchModal.querySelectorAll('[data-smartcity-dispatch-option]').forEach((node) => {
          node.classList.toggle('smartcity-dispatch-option--active', node === option);
        });
        ready?.classList.remove('smartcity-dispatch-ready--calling', 'smartcity-dispatch-ready--connected');
        if (badge) badge.textContent = 'CHỜ GỌI';
        activeDispatchModal.querySelector('[data-smartcity-dispatch-line]').textContent = isFire ? '114 · VOC-12' : '115 · VOC-11';
        activeDispatchModal.querySelector('[data-smartcity-dispatch-type]').textContent = isFire ? 'Cứu hỏa / sơ tán' : 'Y tế khẩn cấp';
        activeDispatchModal.querySelector('[data-smartcity-dispatch-status]').textContent = isFire
          ? 'Đã chọn 114 · VOC-12. Bấm icon điện thoại để gọi. Ghi âm là tùy chọn nếu cần mô tả thêm.'
          : 'Đã chọn 115 · VOC-11. Bấm icon điện thoại để gọi. Ghi âm là tùy chọn nếu cần mô tả thêm.';
        return;
      }
      if (event.target.closest('[data-smartcity-dispatch-submit]')) {
        activeDispatchModal.querySelector('[data-smartcity-dispatch-status]').textContent = 'Đã gửi yêu cầu tới tổng đài VOC và ghi nhận vào ca trực Smart City.';
        const status = document.querySelector('[data-smartcity-fire-status]');
        if (status) status.textContent = 'Đã gọi y tế / cứu hỏa và gửi yêu cầu hỗ trợ.';
        return;
      }
    }

    const activeModal = document.querySelector('[data-smartcity-action-modal]:not([hidden])');
    if (!activeModal) return;
    if (event.target.closest('[data-smartcity-action-close]') || event.target === activeModal) {
      activeModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-smartcity-action-confirm]')) {
      const actionKey = activeModal.dataset.actionKey || 'open';
      const action = SMARTCITY_FIRE_EXIT_ACTIONS[actionKey] || SMARTCITY_FIRE_EXIT_ACTIONS.open;
      activeModal.querySelector('[data-smartcity-action-status]').textContent = action.done;
      applySmartcityAction(actionKey);
    }
  });
}
