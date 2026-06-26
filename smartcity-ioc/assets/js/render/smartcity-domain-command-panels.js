const BLUE = '#00d4ff';
const BLUE_DARK = '#185FA5';
const BLUE_SOFT = '#85B7EB';
const GREEN = '#1D9E75';
const AMBER = '#EF9F27';
const RED = '#E24B4A';

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function heroMetric({ title, icon, label, value, sub }) {
  return `<section class="hud-block smartcity-hud-accent sc-diagram" data-diagram-family="hero">
    ${hudHead(title)}
    <div class="hud-inline-stat"><i class="ti ${icon}"></i><span>${label}</span><strong>${value}</strong></div>
    <div class="hud-sub">${sub}</div>
  </section>`;
}

function statusAlerts(title, items) {
  return `<section class="hud-block sc-diagram" data-diagram-family="event-board">
    ${hudHead(title)}
    ${items.map((a) => `<div class="hud-alert">
      <span class="hud-alert__tag" style="background:${a.tone}22;color:${a.tone}">${a.tag}</span>
      <div class="hud-alert__title">${a.title}</div>
      <div class="hud-alert__time">${a.time} trước</div>
    </div>`).join('')}
  </section>`;
}

function standardChecklist(title, items) {
  return `<section class="hud-block sc-diagram" data-diagram-family="smart-report-checklist">
    ${hudHead(title)}
    <div class="sc-checklist">
      ${items.map((item) => `<span class="sc-check sc-check--${item.tone || 'ok'}">
        <i class="ti ${item.icon || 'ti-check'}"></i><b>${item.value}</b><em>${item.label}</em>
      </span>`).join('')}
    </div>
  </section>`;
}

function utilityResidentHero() {
  const points = [
    { label: 'S5A', value: 88, x: 16, y: 24 },
    { label: 'S6B', value: 64, x: 62, y: 38 },
    { label: 'S7C', value: 76, x: 104, y: 32 },
    { label: 'S8D', value: 96, x: 136, y: 18 },
  ];
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${points[0].x},64 ${line} ${points[points.length - 1].x},64`;
  return `<section class="hud-block smartcity-hud-accent sc-diagram vin-service-hero" data-diagram-family="vin-service-hero">
    ${hudHead('Dịch vụ cư dân Vin')}
    <div class="vin-service-hero__line">
      <svg viewBox="0 0 152 76" aria-hidden="true">
        <defs><linearGradient id="vinResidentArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#185fa5" stop-opacity="0.16"/>
        </linearGradient></defs>
        <path class="vin-service-hero__gridline" d="M16 18H136M16 42H136M16 64H136"/>
        <polygon class="vin-service-hero__area" points="${area}"/>
        <polyline class="vin-service-hero__polyline" points="${line}"/>
        ${points.map((point) => `<g class="vin-service-hero__point">
          <text class="vin-service-hero__pct" x="${point.x}" y="${Math.max(10, point.y - 8)}">${point.value}%</text>
          <circle cx="${point.x}" cy="${point.y}" r="3.1"/>
          <text class="vin-service-hero__label" x="${point.x}" y="74">${point.label}</text>
        </g>`).join('')}
      </svg>
    </div>
    <div class="vin-service-hero__actions">
      <button type="button" data-vin-service-open="fee"><i class="ti ti-home-dollar"></i><span>Phí</span></button>
      <button type="button" data-vin-service-open="waterpark"><i class="ti ti-swimming"></i><span>Waterpark</span></button>
      <button type="button" data-vin-service-open="vinbus"><i class="ti ti-bus"></i><span>VinBus</span></button>
    </div>
  </section>`;
}

function utilityServiceAlertsChart() {
  const alerts = [
    { label: 'WaterPark', value: 54 },
    { label: 'Safari', value: 18 },
    { label: 'VinBus', value: 26 },
  ];
  const peak = Math.max(...alerts.map((item) => item.value));
  return `<section class="hud-block sc-diagram vin-service-alerts" data-diagram-family="vin-service-alerts">
    ${hudHead('Cảnh báo dịch vụ Vin')}
    <div class="vin-service-alerts__chart">
      ${alerts.map((item) => `<span>
        <b>${item.label}</b>
        <i><em style="width:${Math.max(12, item.value / peak * 100)}%"></em></i>
        <strong>${item.value}</strong>
      </span>`).join('')}
    </div>
    <div class="vin-service-alerts__summary">
      <span><b>54</b><em>vượt khung</em></span>
      <span><b>18</b><em>sai ưu đãi</em></span>
      <span><b>128k</b><em>VinBus</em></span>
    </div>
  </section>`;
}

function environmentThermalMap() {
  const metrics = [
    { label: 'Tòa nhà', value: '24', tone: 'ok' },
    { label: 'Phòng cháy chữa cháy', value: '3', tone: 'danger', tab: 'pccc' },
    { label: 'Cư trú', value: '42', tone: 'info', tab: 'residency' },
    { label: 'Cần xử lý', value: '12', tone: 'warn', tab: 'tasks' },
  ];
  return `<section class="hud-block sc-diagram infra-ops-card" data-diagram-family="infrastructure-ops">
    ${hudHead('Quản lý vận hành')}
    <button type="button" class="infra-ops-card__visual" data-infra-ops-open="overview" aria-label="Mở chi tiết vận hành tòa nhà">
      <svg class="infra-ops-spark" viewBox="0 0 180 56" aria-hidden="true">
        <path class="infra-ops-spark__grid" d="M4 9H176M4 28H176M4 47H176"/>
        <polyline class="infra-ops-spark__line" points="4,40 29,33 56,29 84,20 113,25 143,18 172,23"/>
        <g class="infra-ops-spark__dots">
          <circle cx="4" cy="40" r="3.2"/><circle cx="29" cy="33" r="3.2"/><circle cx="56" cy="29" r="3.2"/>
          <circle cx="84" cy="20" r="3.2"/><circle cx="113" cy="25" r="3.2"/><circle cx="143" cy="18" r="3.2"/>
          <circle cx="172" cy="23" r="3.2"/>
        </g>
      </svg>
      <span class="infra-ops-card__caption">Vận hành tòa nhà · 7 ngày</span>
    </button>
    <div class="infra-ops-metrics">
      ${metrics.map((metric) => `<button type="button" class="infra-ops-metric infra-ops-metric--${metric.tone}" data-infra-ops-open="${metric.tab || 'overview'}">
        <b>${metric.value}</b><span>${metric.label}</span>
      </button>`).join('')}
    </div>
    <div class="infra-ops-actions">
      <button type="button" data-infra-ops-open="overview">Chi tiết vận hành</button>
    </div>
  </section>`;
}

const infraOpsBuildings = [
  ['S1.01', 'An toàn', '2 HS', 'Thấp'],
  ['S1.02', 'Cảnh báo', '6 HS', 'Cao'],
  ['S2.03', 'An toàn', '0 HS', 'Thấp'],
  ['S3.01', 'Kiểm tra', '4 HS', 'Vừa'],
];

const infraOpsTabs = [
  ['overview', 'Tất cả'],
  ['pccc', 'Phòng cháy chữa cháy'],
  ['residency', 'Cư trú'],
  ['tasks', 'Cần xử lý'],
];

let pcccRequestCreated = false;
let residencyListVisible = false;

function renderInfraOpsTabs(activeTab) {
  return `<div class="infra-ops-modal__tabs">
    ${infraOpsTabs.map(([id, label]) => `<button type="button" class="${id === activeTab ? 'is-active' : ''}" data-infra-ops-tab="${id}">${label}</button>`).join('')}
  </div>`;
}

function renderInfraOpsOverview() {
  return `<div class="infra-ops-modal__table">
    ${renderInfraOpsTabs('overview')}
    <div class="infra-ops-table-row infra-ops-table-row--head infra-ops-table-row--overview"><span>Tòa nhà</span><span>Phòng cháy chữa cháy</span><span>Cư trú</span><span>Mức độ</span></div>
    ${infraOpsBuildings.map((row) => `<button type="button" class="infra-ops-table-row infra-ops-table-row--overview" data-infra-ops-tab="${row[1] === 'Cảnh báo' ? 'pccc' : 'residency'}">
      ${row.map((cell) => `<span>${cell}</span>`).join('')}
    </button>`).join('')}
  </div>
  <aside class="infra-ops-modal__alerts">
    <h4>Cảnh báo ưu tiên</h4>
    <p><b>S1.02</b><span>Cảm biến khói tầng 12 · cập nhật 3 phút trước</span></p>
    <p><b>S2.01</b><span>Bình chữa cháy hết hạn · cần kiểm tra</span></p>
    <p><b>S2.04</b><span>6 hồ sơ tạm trú chưa hoàn tất · chỉ mở chi tiết trong danh sách xử lý</span></p>
  </aside>`;
}

function renderInfraOpsPccc() {
  const status = pcccRequestCreated ? 'Đang xử lý' : 'Cảnh báo mức cao';
  return `<div class="infra-ops-modal__table infra-ops-modal__table--full">
    ${renderInfraOpsTabs('pccc')}
    <section class="infra-ops-tab-panel">
      <header class="infra-ops-tab-panel__head"><h4>PCCC</h4><span data-pccc-status>${status}</span></header>
      <div class="infra-ops-fact-grid">
        <span>Cảm biến khói</span><b>1 cảnh báo</b>
        <span>Bình chữa cháy</span><b>Đạt 96%</b>
        <span>Lối thoát hiểm</span><b>Bình thường</b>
        <span>Kiểm tra gần nhất</span><b>08/06/2026</b>
        <span>Kiểm tra tiếp theo</span><b>08/07/2026</b>
      </div>
      <div class="infra-ops-check-zone">
        <h5>Vị trí cần kiểm tra</h5>
        <p><i class="infra-ops-dot infra-ops-dot--red"></i>Tầng 12 · Hành lang · Cảm biến khói bất thường</p>
        <p><i class="infra-ops-dot infra-ops-dot--yellow"></i>Tầng B1 · Bình chữa cháy sắp hết hạn</p>
      </div>
      <div class="infra-ops-panel-actions">
        <button type="button">Xác nhận cảnh báo</button>
        <button type="button" data-pccc-create-request>Tạo yêu cầu kiểm tra</button>
        <button type="button">Đánh dấu xử lý</button>
      </div>
    </section>
  </div>`;
}

function renderInfraOpsResidency() {
  return `<div class="infra-ops-modal__table infra-ops-modal__table--full">
    ${renderInfraOpsTabs('residency')}
    <section class="infra-ops-tab-panel">
      <header class="infra-ops-tab-panel__head"><h4>Tạm trú / Thường trú</h4></header>
      <div class="infra-ops-fact-grid">
        <span>Chưa khai báo</span><b>3 hồ sơ</b>
        <span>Thiếu thông tin</span><b>2 hồ sơ</b>
        <span>Đang chờ xác nhận</span><b>1 hồ sơ</b>
        <span>Quá hạn trên 7 ngày</span><b>4 hồ sơ</b>
      </div>
      <div class="infra-ops-age-zone">
        <h5>Thời gian chưa hoàn tất</h5>
        <p><span>Dưới 3 ngày</span><i style="--w:70%"></i><b>12</b></p>
        <p><span>Từ 3 đến 7 ngày</span><i style="--w:48%"></i><b>7</b></p>
        <p><span>Trên 7 ngày</span><i style="--w:32%"></i><b>4</b></p>
      </div>
      <div class="infra-ops-panel-actions">
        <button type="button">Gửi nhắc bổ sung hồ sơ</button>
        <button type="button" data-residency-show-list>Xem danh sách cần xử lý</button>
      </div>
      ${residencyListVisible ? `<div class="infra-ops-resident-list">
        <div class="infra-ops-table-row infra-ops-table-row--head infra-ops-table-row--residents"><span>Mã hồ sơ</span><span>Tòa nhà</span><span>Trạng thái</span><span>Quá hạn</span></div>
        ${[
          ['HS-0421', 'S2.04', 'Thiếu xác nhận tạm trú', '8 ngày'],
          ['HS-0428', 'S2.04', 'Thiếu giấy tờ bổ sung', '9 ngày'],
          ['HS-0433', 'S3.01', 'Chưa khai báo thường trú', '11 ngày'],
        ].map((row) => `<div class="infra-ops-table-row infra-ops-table-row--residents">${row.map((cell) => `<span>${cell}</span>`).join('')}</div>`).join('')}
      </div>` : ''}
    </section>
  </div>`;
}

function renderInfraOpsTasks() {
  const filters = ['Tất cả: 12', 'Khẩn cấp: 3', 'PCCC: 3', 'Phí dịch vụ: 5', 'Cư trú: 4'];
  const tasks = [
    ['🔴 Cao', 'S1.02', 'PCCC', 'Cảm biến khói tầng 12', '3 phút'],
    ['🔴 Cao', 'S2.01', 'PCCC', 'Bình chữa cháy hết hạn', '2 ngày'],
    ['🟠 Vừa', 'S3.01', 'Phí dịch vụ', '18 căn chưa đóng phí', 'Trên 30 ngày'],
    ['🟡 Vừa', 'S2.04', 'Cư trú', '6 hồ sơ chưa hoàn tất', 'Trên 7 ngày'],
  ];
  return `<div class="infra-ops-modal__table infra-ops-modal__table--full">
    ${renderInfraOpsTabs('tasks')}
    <section class="infra-ops-tab-panel">
      <header class="infra-ops-tab-panel__head"><h4>Cần xử lý</h4><span>12 tác vụ</span></header>
      <div class="infra-ops-task-filters">${filters.map((filter, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}">${filter}</button>`).join('')}</div>
      <div class="infra-ops-table-row infra-ops-table-row--head infra-ops-table-row--tasks"><span>Mức độ</span><span>Tòa nhà</span><span>Hạng mục</span><span>Nội dung</span><span>Quá hạn</span></div>
      ${tasks.map((row) => `<button type="button" class="infra-ops-table-row infra-ops-table-row--tasks">${row.map((cell) => `<span>${cell}</span>`).join('')}</button>`).join('')}
      <div class="infra-ops-panel-actions infra-ops-panel-actions--left"><button type="button">Xem thêm tác vụ</button></div>
    </section>
  </div>`;
}

function renderInfraOpsModalBody(activeTab) {
  if (activeTab === 'pccc') return renderInfraOpsPccc();
  if (activeTab === 'residency') return renderInfraOpsResidency();
  if (activeTab === 'tasks') return renderInfraOpsTasks();
  return renderInfraOpsOverview();
}

function renderInfrastructureOpsModal(activeTab = 'overview') {
  return `<div class="infra-ops-modal" data-infra-ops-modal>
    <div class="infra-ops-modal__panel" role="dialog" aria-modal="true" aria-label="Chi tiết vận hành tòa nhà">
      <button type="button" class="infra-ops-modal__close" data-infra-ops-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="infra-ops-modal__head">
        <div>
          <small>Quản lý vận hành</small>
          <h3>Hạ tầng & vận hành tòa nhà</h3>
          <p>Theo dõi trạng thái vận hành, phòng cháy chữa cháy và hồ sơ cư trú. Thông tin cư dân chi tiết chỉ mở sau khi chọn danh sách cần xử lý.</p>
        </div>
      </header>
      <section class="infra-ops-modal__kpis">
        <button type="button"><span>Tổng tòa nhà</span><b>24</b><em>Đang vận hành</em></button>
        <button type="button" data-infra-ops-tab="pccc"><span>Phòng cháy chữa cháy</span><b>3</b><em>Cần xử lý ngay</em></button>
        <button type="button" data-infra-ops-tab="residency"><span>Hồ sơ cư trú</span><b>42 hồ sơ</b><em>18 quá hạn</em></button>
        <button type="button" data-infra-ops-tab="tasks"><span>Cần xử lý</span><b>12</b><em>3 khẩn cấp</em></button>
      </section>
      <section class="infra-ops-modal__body" data-infra-ops-body>
        ${renderInfraOpsModalBody(activeTab)}
      </section>
    </div>
  </div>`;
}

function setInfraOpsTab(tab) {
  const body = document.querySelector('[data-infra-ops-body]');
  if (body) body.innerHTML = renderInfraOpsModalBody(tab);
}

function showInfraOpsToast(message) {
  document.querySelector('[data-infra-ops-toast]')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="infra-ops-toast" data-infra-ops-toast>${message}</div>`);
  window.setTimeout(() => document.querySelector('[data-infra-ops-toast]')?.remove(), 2200);
}

const infrastructureHotspotItems = [
  { key: 'power', label: 'Điện', value: '1', icon: 'ti-bolt', title: 'Trạm điện B2 quá tải', status: 'Giảm tải nhánh B2 trong 15 phút.', action: 'Điều phối kỹ thuật điện', location: 'Trạm B2 · Tủ MSB-02', owner: 'Đội điện ca A', deadline: '15 phút', metrics: [['Tải', '94%'], ['Dự phòng', '2N'], ['UPS', '38m']], steps: ['Giảm tải nhánh B2', 'Kiểm tra nhiệt tủ MSB', 'Xác nhận tải về dưới 80%'] },
  { key: 'water', label: 'Nước', value: '2', icon: 'ti-droplet', title: 'Áp suất nước thấp', status: 'Hai cụm bơm cần kiểm tra áp lực.', action: 'Mở lệnh kiểm tra bơm', location: 'Cụm bơm P07/P11', owner: 'Đội nước', deadline: '32 phút', metrics: [['Áp suất', '2.1 bar'], ['Bơm online', '23/24'], ['Van', '92%']], steps: ['Kiểm tra bơm P07', 'Mở tuyến cấp bù', 'Đối chiếu áp suất tầng cao'] },
  { key: 'lift', label: 'Thang', value: '1', icon: 'ti-elevator', title: 'Cabin thang báo lỗi', status: 'Tòa S2, thang số 03 cần khóa tạm.', action: 'Gửi đội bảo trì thang', location: 'S2 · Thang 03', owner: 'Bảo trì thang máy', deadline: '18 phút', metrics: [['Lỗi', 'E42'], ['Cabin', 'Tầng 12'], ['SLA', '86%']], steps: ['Khóa gọi tầng', 'Thông báo cư dân S2', 'Reset bộ điều khiển cabin'] },
  { key: 'site', label: 'Công trường', value: '3', icon: 'ti-barrier-block', title: 'Bụi và tiếng ồn tăng', status: 'Ba điểm thi công vượt dải giám sát.', action: 'Nhắc nhà thầu xử lý', location: 'Cổng C · Khu thi công', owner: 'Ban an toàn công trường', deadline: '20 phút', metrics: [['Bụi', '72%'], ['Ồn', '68 dB'], ['Điểm', '3']], steps: ['Tưới giảm bụi', 'Giảm khung giờ ồn', 'Ghi nhận ảnh hiện trường'] },
  { key: 'camera', label: 'Camera', value: '3', icon: 'ti-device-cctv', title: 'Camera offline', status: 'Ba camera vành đai mất tín hiệu.', action: 'Kiểm tra tuyến mạng', location: 'Vành đai B/C', owner: 'Đội mạng camera', deadline: '26 phút', metrics: [['Offline', '3'], ['Online', '72'], ['NVR', 'OK']], steps: ['Ping camera offline', 'Kiểm tra switch PoE', 'Ghim camera thay thế'] },
  { key: 'light', label: 'Đèn', value: '5', icon: 'ti-bulb', title: 'Chiếu sáng cần kiểm tra', status: 'Năm đèn LED chưa phản hồi điều khiển.', action: 'Tạo phiếu bảo trì đèn', location: 'Trục đường D2', owner: 'Đội chiếu sáng', deadline: '1 giờ', metrics: [['Đèn lỗi', '5'], ['Lux TB', '78%'], ['Tủ', 'D2-04']], steps: ['Kiểm tra tủ D2-04', 'Bật kịch bản bù sáng', 'Tạo phiếu thay driver LED'] },
];

function renderInfrastructureHotspotModal(item) {
  return `<div class="infra-hotspot-modal" data-infra-hotspot-modal>
    <div class="infra-hotspot-modal__panel" role="dialog" aria-modal="true" aria-label="${item.title}">
      <button type="button" class="infra-hotspot-modal__close" data-infra-hotspot-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="infra-hotspot-modal__head">
        <span><i class="ti ${item.icon}"></i></span>
        <div><small>${item.label}</small><h3>${item.title}</h3></div>
        <b>${item.value}</b>
      </div>
      <p>${item.status}</p>
      <div class="infra-hotspot-modal__meta">
        <span><b>Vị trí</b><em>${item.location}</em></span>
        <span><b>Phụ trách</b><em>${item.owner}</em></span>
        <span><b>SLA</b><em>${item.deadline}</em></span>
      </div>
      <div class="infra-hotspot-modal__metrics">
        ${item.metrics.map((metric) => `<span><b>${metric[1]}</b><em>${metric[0]}</em></span>`).join('')}
      </div>
      <div class="infra-hotspot-modal__steps">
        ${item.steps.map((step, index) => `<span><b>${String(index + 1).padStart(2, '0')}</b><em>${step}</em></span>`).join('')}
      </div>
      <div class="infra-hotspot-modal__status">
        <i></i><span>Ưu tiên điều phối trong ca hiện tại</span>
      </div>
      <button type="button" class="infra-hotspot-modal__action">${item.action}</button>
    </div>
  </div>`;
}

function renderInfrastructureTaskSummaryModal() {
  const rows = [
    ['Khẩn cấp', 'Điện', 'Trạm B2 quá tải', '15 phút'],
    ['Quá hạn', 'Nước', 'Áp suất thấp cụm bơm', '32 phút'],
    ['Đang xử lý', 'Thang', 'Cabin S2-03 báo lỗi', '18 phút'],
    ['Đang xử lý', 'Camera', '3 camera offline', '26 phút'],
    ['Theo dõi', 'Đèn', '5 đèn chưa phản hồi', '1 giờ'],
  ];
  return `<div class="infra-hotspot-modal infra-task-summary-modal" data-infra-task-summary-modal>
    <div class="infra-hotspot-modal__panel" role="dialog" aria-modal="true" aria-label="Danh sách xử lý hạ tầng">
      <button type="button" class="infra-hotspot-modal__close" data-infra-task-summary-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="infra-hotspot-modal__head">
        <span><i class="ti ti-list-check"></i></span>
        <div><small>HẠ TẦNG</small><h3>Danh sách xử lý hạ tầng</h3></div>
        <b>12</b>
      </div>
      <div class="infra-task-summary-list">
        ${rows.map((row) => `<button type="button">
          <b>${row[0]}</b><span>${row[1]}</span><em>${row[2]}</em><strong>${row[3]}</strong>
        </button>`).join('')}
      </div>
    </div>
  </div>`;
}

const infrastructureSlaItems = [
  { label: 'Dien', display: 'Điện', value: 96, visual: 96, status: 'Ổn định', need: 'Giữ 1 kỹ thuật trực', move: 'Không cần đổi ca' },
  { label: 'Nuoc', display: 'Nước', value: 91, visual: 76, status: 'Theo dõi', need: 'Bổ sung kiểm tra bơm', move: 'Chuyển 1 người từ Điện sang Nước' },
  { label: 'Thang', display: 'Thang', value: 86, visual: 56, status: 'Nguy cơ trễ', need: 'Cần xử lý lỗi cabin nhanh', move: 'Gán đội bảo trì thang ưu tiên 18 phút' },
  { label: 'Den', display: 'Đèn', value: 94, visual: 88, status: 'Ổn định', need: 'Giữ lịch bảo trì', move: 'Không cần đổi ca' },
  { label: 'Cam', display: 'Cam', value: 88, visual: 64, status: 'Cần kéo lên', need: 'Thiếu người kiểm tra switch PoE', move: 'Chuyển 1 kỹ thuật mạng sang Camera' },
  { label: 'CT', display: 'CT', value: 82, visual: 40, status: 'Thấp nhất', need: 'Cần nhắc nhà thầu tại hiện trường', move: 'Gán giám sát hiện trường hỗ trợ Công trường' },
];

function renderInfrastructureSlaModal(mode = 'risk') {
  const weakItems = infrastructureSlaItems.filter((item) => item.value < 90);
  const activeTitle = mode === 'rebalance' ? 'Đề xuất cân ca SLA' : 'Điểm nghẽn SLA trong ca';
  return `<div class="infra-sla-modal" data-infra-sla-modal>
    <div class="infra-sla-modal__panel" role="dialog" aria-modal="true" aria-label="${activeTitle}">
      <button type="button" class="infra-sla-modal__close" data-infra-sla-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="infra-sla-modal__head">
        <small>Không trùng ticket điểm nóng</small>
        <h3>${activeTitle}</h3>
        <p>Dùng để cân người trong ca trước khi ticket quá hạn, không mở xử lý sự cố riêng lẻ.</p>
      </header>
      <div class="infra-sla-modal__body">
        <section class="infra-sla-modal__risk">
          <h4>Nhóm cần kéo SLA lên</h4>
          ${weakItems.map((item) => `<button type="button" data-infra-sla-focus="${item.display}">
            <b>${item.display}</b><span>${item.value}%</span><em>${item.need}</em>
          </button>`).join('')}
        </section>
        <section class="infra-sla-modal__plan">
          <h4>Kịch bản điều phối</h4>
          ${infrastructureSlaItems.map((item) => `<span class="${item.value < 90 ? 'is-weak' : ''}">
            <i>${item.value}%</i><b>${item.status}</b><em>${mode === 'rebalance' ? item.move : item.need}</em>
          </span>`).join('')}
        </section>
      </div>
      <footer class="infra-sla-modal__foot">
        <span data-infra-sla-status>Ưu tiên kéo CT, Thang và Cam lên trên 90% trong 30 phút.</span>
        <button type="button" data-infra-sla-apply>Áp dụng gợi ý ca</button>
      </footer>
    </div>
  </div>`;
}

function showInfrastructureHotspotModal(key) {
  const item = infrastructureHotspotItems.find((entry) => entry.key === key) || infrastructureHotspotItems[0];
  document.querySelector('[data-infra-hotspot-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderInfrastructureHotspotModal(item));
}

function showInfrastructureTaskSummaryModal() {
  document.querySelector('[data-infra-task-summary-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderInfrastructureTaskSummaryModal());
}

function showInfrastructureSlaModal(mode) {
  document.querySelector('[data-infra-sla-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderInfrastructureSlaModal(mode));
}

const constructionSites = [
  { id: 'S5A', name: 'Tòa S5A', progress: 88, status: 'Hoàn thiện', risk: 'Bụi thấp', crew: '86 công nhân', eta: 'Q3/2026' },
  { id: 'S6B', name: 'Tòa S6B', progress: 64, status: 'Kết cấu', risk: 'Cần che chắn', crew: '124 công nhân', eta: 'Q4/2026' },
  { id: 'S7C', name: 'Tòa S7C', progress: 76, status: 'MEP', risk: 'Ổn định', crew: '72 công nhân', eta: 'Q4/2026' },
  { id: 'S8D', name: 'Tòa S8D', progress: 96, status: 'Nghiệm thu', risk: 'Sẵn sàng bàn giao', crew: '34 công nhân', eta: '06/2026' },
];

function renderConstructionModal(mode = 'progress') {
  const isConflict = mode === 'conflict';
  return `<div class="construction-modal" data-construction-modal>
    <div class="construction-modal__panel" role="dialog" aria-modal="true" aria-label="${isConflict ? 'Xung đột thi công' : 'Tiến độ tòa đang xây'}">
      <button type="button" class="construction-modal__close" data-construction-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="construction-modal__head">
        <small>Thông tin công trình</small>
        <h3>${isConflict ? 'Xung đột thi công cần xử lý' : 'Tiến độ các tòa đang xây dựng'}</h3>
        <p>${isConflict ? 'Tập trung các điểm có thể ảnh hưởng cư dân: bụi, tiếng ồn, xe vật liệu và che chắn.' : 'Theo dõi tiến độ từng tòa để ưu tiên giám sát, nghiệm thu và điều phối hiện trường.'}</p>
      </header>
      <div class="construction-modal__grid">
        ${constructionSites.map((site) => `<button type="button" data-construction-site="${site.id}">
          <b>${site.name}</b><strong>${site.progress}%</strong><span>${site.status}</span><em>${isConflict ? site.risk : site.eta}</em>
        </button>`).join('')}
      </div>
      <section class="construction-modal__detail">
        <h4>${isConflict ? 'Khuyến nghị vận hành' : 'Kế hoạch giám sát'}</h4>
        <div>
          <span><b>S6B</b><em>${isConflict ? 'Bổ sung lưới chắn bụi, đổi khung giờ xe vật liệu.' : 'Cần kiểm tra che chắn và luồng vận chuyển vật liệu.'}</em></span>
          <span><b>S7C</b><em>${isConflict ? 'Giữ đường nội khu sạch trước 17:00.' : 'Theo dõi MEP, chuẩn bị lịch nghiệm thu theo tầng.'}</em></span>
        </div>
      </section>
      <footer class="construction-modal__foot">
        <span data-construction-status>Chọn một tòa để xem ưu tiên giám sát trong ca.</span>
        <button type="button" data-construction-apply>${isConflict ? 'Tạo nhắc hiện trường' : 'Ghim lịch giám sát'}</button>
      </footer>
    </div>
  </div>`;
}

function showConstructionModal(mode) {
  document.querySelector('[data-construction-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderConstructionModal(mode));
}

function showPcccModal(type) {
  document.querySelectorAll('[data-pccc-risk-modal], [data-pccc-sensor-modal], [data-pccc-history-modal], [data-pccc-dispatch-modal], [data-pccc-power-modal], [data-pccc-smoke-modal]').forEach((modal) => modal.remove());
  const modalByType = {
    risk: pcccRiskModal,
    sensor: pcccSensorModal,
    history: pcccHistoryModal,
    alarm: () => pcccDispatchModal(),
    smoke: pcccSmokeModal,
    power: () => pcccPowerModal(),
  };
  document.body.insertAdjacentHTML('beforeend', (modalByType[type] || modalByType.risk)());
}

function runPcccSmokeGauge() {
  return new Promise((resolve) => {
    const modal = document.querySelector('[data-pccc-smoke-modal]');
    const ring = modal?.querySelector('[data-pccc-smoke-ring]');
    const pctEl = modal?.querySelector('[data-pccc-smoke-pct]');
    const status = modal?.querySelector('[data-pccc-smoke-status]');
    if (!modal || !ring || !pctEl || !status) {
      resolve();
      return;
    }
    const circ = 2 * Math.PI * 52;
    ring.style.strokeDasharray = String(circ);
    ring.style.strokeDashoffset = String(circ);
    let pct = 0;
    const timer = window.setInterval(() => {
      pct = Math.min(100, pct + 20);
      pctEl.textContent = String(pct);
      ring.style.strokeDashoffset = String(circ * (1 - pct / 100));
      status.textContent = pct >= 100
        ? 'Đã hút khói khu nguy cơ, cảm biến đang trở về ngưỡng an toàn.'
        : 'Đang hút khói, quạt áp lực và cảm biến khói đang cập nhật theo thời gian thực.';
      if (pct >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 220);
  });
}

function runPcccPowerSequence() {
  return new Promise((resolve) => {
    const modal = document.querySelector('[data-pccc-power-modal]');
    const zones = Array.from(modal?.querySelectorAll('[data-pccc-power-zone]') || []);
    const status = modal?.querySelector('[data-pccc-power-status]');
    let index = 0;
    const tick = () => {
      const zone = zones[index];
      if (!zone) {
        if (status) status.textContent = 'Đã cắt điện toàn thành phố. Nguồn ưu tiên vẫn hoạt động.';
        resolve();
        return;
      }
      zone.classList.remove('smartcity-power-zone--on');
      zone.classList.add('smartcity-power-zone--off');
      if (status) status.textContent = `Đang cắt điện ${zone.dataset.pcccPowerZone}...`;
      index += 1;
      window.setTimeout(tick, 170);
    };
    tick();
  });
}

function triggerPcccDispatchCall(modal) {
  const readyCall = modal?.querySelector('[data-pccc-dispatch-call]');
  if (!readyCall || readyCall.classList.contains('smartcity-dispatch-ready--calling')) return;
  const line = modal.querySelector('[data-pccc-dispatch-line]')?.textContent.trim() || '114 · VOC-12';
  const status = modal.querySelector('[data-pccc-dispatch-status]');
  const badge = readyCall.querySelector('small');
  readyCall.classList.remove('smartcity-dispatch-ready--connected');
  readyCall.classList.add('smartcity-dispatch-ready--calling');
  if (badge) badge.textContent = 'ĐANG GỌI';
  if (status) status.textContent = `Đang gọi ${line}...`;
  window.setTimeout(() => {
    readyCall.classList.remove('smartcity-dispatch-ready--calling');
    readyCall.classList.add('smartcity-dispatch-ready--connected');
    if (badge) badge.textContent = 'ĐÃ GỌI';
    if (status) status.textContent = `Cuộc gọi đã kết nối với ${line}. Bấm Kết thúc & gửi yêu cầu trong form.`;
  }, 1400);
}

async function startPcccAutoChain(button) {
  if (!button || button.dataset.running === 'true') return;
  const status = button.closest('.event-fire-auto')?.querySelector('[data-pccc-card-status]')
    || document.querySelector('[data-pccc-card-status]');
  button.dataset.running = 'true';
  button.classList.add('event-fire-auto__button--running');
  if (status) status.textContent = '01 · Đang cắt điện toàn thành phố';
  showPcccModal('power');
  await runPcccPowerSequence();
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  document.querySelector('[data-pccc-power-modal]')?.remove();
  if (status) status.textContent = '02 · Đang mở hút khói khu nguy cơ';
  showPcccModal('smoke');
  await runPcccSmokeGauge();
  await new Promise((resolve) => window.setTimeout(resolve, 420));
  document.querySelector('[data-pccc-smoke-modal]')?.remove();
  if (status) status.textContent = '03 · Đang gọi cứu hỏa / sơ tán';
  document.body.insertAdjacentHTML('beforeend', pcccDispatchModal({ auto: true }));
  const dispatchModal = document.querySelector('[data-pccc-dispatch-modal]');
  window.setTimeout(() => triggerPcccDispatchCall(dispatchModal), 220);
  if (status) status.textContent = 'Đã cắt điện, hút khói và mở yêu cầu cứu hỏa / sơ tán.';
  button.classList.remove('event-fire-auto__button--running');
  button.classList.add('event-fire-auto__button--done');
  button.dataset.running = 'false';
}

function renderPipeIocPanel(entry) {
  const rows = [
    ['Global ID', entry.IFC_GlobalId],
    ['Tên', entry.IFC_Name],
    ['Lớp IFC', entry.IFC_Class],
    ['Tag', entry.IFC_Tag],
    ['Tầng', entry.IFC_Storey],
    ['Loại', entry.IFC_TypeName],
    ['Vật liệu', entry.IFC_Materials],
    ['Tệp nguồn', entry.IFC_SourceFile],
    ['Trạng thái', entry.IOC_SQLite_Status],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
  return `<div class="pipe-ioc-panel" data-pipe-ioc-panel>
    <button type="button" class="pipe-ioc-panel__close" data-pipe-ioc-close aria-label="Đóng"><i class="ti ti-x"></i></button>
    <div class="pipe-ioc-panel__head">
      <span><i class="ti ti-pipe"></i></span>
      <div><small>IOC Info · Đường ống</small><h3>${entry.IFC_Name || entry.IFC_GlobalId || 'Phần tử đường ống'}</h3></div>
    </div>
    <div class="pipe-ioc-panel__grid">
      ${rows.map(([label, value]) => `<span class="pipe-ioc-panel__k">${label}</span><span class="pipe-ioc-panel__v">${value}</span>`).join('')}
    </div>
  </div>`;
}

function showPipeIocPanel(entry) {
  document.querySelector('[data-pipe-ioc-panel]')?.remove();
  if (!entry) return;
  document.body.insertAdjacentHTML('beforeend', renderPipeIocPanel(entry));
}

// Bảng IOC info cho từng phần tử tòa TecnoPark (dùng lại style .pipe-ioc-panel).
function renderTechnoIocPanel(entry) {
  const rows = [
    ['Global ID', entry.IFC_GlobalId],
    ['Tên', entry.IFC_Name],
    ['Lớp IFC', entry.IFC_Class],
    ['Tag', entry.IFC_Tag],
    ['Tầng', entry.IFC_Storey],
    ['Loại', entry.IFC_TypeName],
    ['Vật liệu', entry.IFC_Materials],
    ['Tệp nguồn', entry.IFC_SourceFile],
    ['Trạng thái', entry.IOC_SQLite_Status],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
  return `<div class="pipe-ioc-panel" data-techno-ioc-panel>
    <button type="button" class="pipe-ioc-panel__close" data-techno-ioc-close aria-label="Đóng"><i class="ti ti-x"></i></button>
    <div class="pipe-ioc-panel__head">
      <span><i class="ti ti-building-skyscraper"></i></span>
      <div><small>IOC Info · TecnoPark</small><h3>${entry.IFC_Name || entry.IFC_GlobalId || 'Phần tử tòa nhà'}</h3></div>
    </div>
    <div class="pipe-ioc-panel__grid">
      ${rows.map(([label, value]) => `<span class="pipe-ioc-panel__k">${label}</span><span class="pipe-ioc-panel__v">${value}</span>`).join('')}
    </div>
  </div>`;
}

function showTechnoIocPanel(entry) {
  document.querySelector('[data-techno-ioc-panel]')?.remove();
  if (!entry) return;
  document.body.insertAdjacentHTML('beforeend', renderTechnoIocPanel(entry));
}

export function bindInfrastructureOpsModal() {
  if (document.body.dataset.infraOpsBound === 'true') return;
  document.body.dataset.infraOpsBound = 'true';

  // Thanh trượt "Hiện đường ống": mờ dần thành phố để lộ mạng đường ống ngầm.
  document.addEventListener('input', (event) => {
    const slider = event.target.closest('[data-pipe-reveal]');
    if (!slider) return;
    const pct = Math.max(0, Math.min(100, Number(slider.value) || 0));
    const label = slider.closest('[data-pipe-reveal-host]')?.querySelector('[data-pipe-reveal-value]');
    if (label) label.textContent = `${pct}%`;
    window.__smartcitySetPipeReveal?.(pct / 100);
  });

  // Switch "Bật bản đồ": hiện bản đồ thế giới (đĩa tròn) dưới thành phố + nút Đến TechnoPark.
  document.addEventListener('change', (event) => {
    const toggle = event.target.closest('[data-worldmap-toggle]');
    if (!toggle) return;
    const on = toggle.checked;
    const host = toggle.closest('[data-worldmap-host]');
    const goto = host?.querySelector('[data-worldmap-goto]');
    if (goto) goto.hidden = !on;
    window.__smartcitySetWorldMap?.(on);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-worldmap-goto]')) {
      window.__smartcityFocusTechnopark?.();
    }
  });

  // Bấm vào phần tử đường ống trong cảnh 3D → hiện bảng IOC info của phần tử đó.
  window.addEventListener('smartcity-pipe-pick', (event) => {
    showPipeIocPanel(event.detail);
  });

  // Bấm vào phần tử tòa TecnoPark → hiện bảng IOC info của phần tử đó.
  window.addEventListener('smartcity-tecnopark-pick', (event) => {
    showTechnoIocPanel(event.detail);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-pipe-ioc-close]')) {
      document.querySelector('[data-pipe-ioc-panel]')?.remove();
      window.__smartcityClearPipeHighlight?.();
      return;
    }
    if (event.target.closest('[data-techno-ioc-close]')) {
      document.querySelector('[data-techno-ioc-panel]')?.remove();
      window.__smartcityClearTechnoHighlight?.();
      return;
    }

    const opener = event.target.closest('[data-infra-ops-open]');
    if (opener) {
      const tab = opener.dataset.infraOpsOpen || 'overview';
      residencyListVisible = false;
      document.querySelector('[data-infra-ops-modal]')?.remove();
      document.body.insertAdjacentHTML('beforeend', renderInfrastructureOpsModal(tab));
      return;
    }

    const tabButton = event.target.closest('[data-infra-ops-tab]');
    if (tabButton) {
      setInfraOpsTab(tabButton.dataset.infraOpsTab);
      return;
    }

    if (event.target.closest('[data-pccc-create-request]')) {
      pcccRequestCreated = true;
      setInfraOpsTab('pccc');
      showInfraOpsToast('Đã tạo yêu cầu kiểm tra');
      return;
    }

    if (event.target.closest('[data-residency-show-list]')) {
      residencyListVisible = true;
      setInfraOpsTab('residency');
      return;
    }

    if (event.target.closest('[data-infra-task-summary-open]')) {
      showInfrastructureTaskSummaryModal();
      return;
    }

    const infraSlaOpen = event.target.closest('[data-infra-sla-open]');
    if (infraSlaOpen) {
      showInfrastructureSlaModal(infraSlaOpen.dataset.infraSlaOpen || 'risk');
      return;
    }

    const infraSlaModal = event.target.closest('[data-infra-sla-modal]');
    if (event.target.closest('[data-infra-sla-close]') || event.target === infraSlaModal) {
      infraSlaModal?.remove();
      return;
    }

    const infraSlaFocus = event.target.closest('[data-infra-sla-focus]');
    if (infraSlaFocus) {
      const status = infraSlaFocus.closest('[data-infra-sla-modal]')?.querySelector('[data-infra-sla-status]');
      if (status) status.textContent = `Đã chọn nhóm ${infraSlaFocus.dataset.infraSlaFocus}: ưu tiên kiểm tra nguồn lực trong ca hiện tại.`;
      return;
    }

    if (event.target.closest('[data-infra-sla-apply]')) {
      const status = event.target.closest('[data-infra-sla-modal]')?.querySelector('[data-infra-sla-status]');
      if (status) status.textContent = 'Đã áp dụng gợi ý cân ca: CT, Thang và Cam được kéo vào danh sách ưu tiên.';
      showInfraOpsToast('Đã áp dụng gợi ý cân ca SLA');
      return;
    }

    const constructionOpen = event.target.closest('[data-construction-open]');
    if (constructionOpen) {
      showConstructionModal(constructionOpen.dataset.constructionOpen || 'progress');
      return;
    }

    const constructionModal = event.target.closest('[data-construction-modal]');
    if (event.target.closest('[data-construction-close]') || event.target === constructionModal) {
      constructionModal?.remove();
      return;
    }

    const constructionSite = event.target.closest('[data-construction-site]');
    if (constructionSite) {
      const status = constructionSite.closest('[data-construction-modal]')?.querySelector('[data-construction-status]');
      if (status) status.textContent = `Đã chọn ${constructionSite.dataset.constructionSite}: ghim vào ca giám sát hiện trường.`;
      return;
    }

    if (event.target.closest('[data-construction-apply]')) {
      const status = event.target.closest('[data-construction-modal]')?.querySelector('[data-construction-status]');
      if (status) status.textContent = 'Đã gửi nhắc hiện trường và ghim lịch giám sát cho ca này.';
      showInfraOpsToast('Đã cập nhật giám sát công trình');
      return;
    }

    const infraAlertOpen = event.target.closest('[data-infra-alert-open]');
    if (infraAlertOpen) {
      showInfrastructureAlertModal(infraAlertOpen.dataset.infraAlertOpen || 'routes');
      return;
    }

    const infraAlertModal = event.target.closest('[data-infra-alert-modal]');
    if (event.target.closest('[data-infra-alert-close]') || event.target === infraAlertModal) {
      infraAlertModal?.remove();
      return;
    }

    const infraAlertItem = event.target.closest('[data-infra-alert-modal] [data-infra-alert-item]');
    if (infraAlertItem) {
      const status = infraAlertItem.closest('[data-infra-alert-modal]')?.querySelector('[data-infra-alert-status]');
      const item = infrastructureAlertItems.find((entry) => entry.id === infraAlertItem.dataset.infraAlertItem);
      if (status && item) status.textContent = `Đã chọn ${item.tag}: ${item.action}`;
      return;
    }

    if (event.target.closest('[data-infra-alert-apply]')) {
      const status = event.target.closest('[data-infra-alert-modal]')?.querySelector('[data-infra-alert-status]');
      if (status) status.textContent = 'Đã ghim tuyến xử lý và gửi thông báo cho đội phụ trách.';
      showInfraOpsToast('Đã cập nhật cảnh báo hạ tầng');
      return;
    }

    const infraTaskSummaryModal = event.target.closest('[data-infra-task-summary-modal]');
    if (event.target.closest('[data-infra-task-summary-close]') || event.target === infraTaskSummaryModal) {
      infraTaskSummaryModal?.remove();
      return;
    }

    const infraHotspot = event.target.closest('[data-infra-hotspot]');
    if (infraHotspot) {
      showInfrastructureHotspotModal(infraHotspot.dataset.infraHotspot);
      return;
    }

    const infraHotspotModal = event.target.closest('[data-infra-hotspot-modal]');
    if (event.target.closest('[data-infra-hotspot-close]') || event.target === infraHotspotModal) {
      infraHotspotModal?.remove();
      return;
    }

    const pcccOpen = event.target.closest('[data-pccc-open]');
    if (pcccOpen) {
      const modalType = pcccOpen.dataset.pcccOpen;
      if (modalType === 'auto') {
        startPcccAutoChain(pcccOpen);
        return;
      }
      showPcccModal(modalType);
      if (modalType === 'smoke') runPcccSmokeGauge();
      return;
    }

    const pcccBuildingAlert = event.target.closest('[data-pccc-building-alert]');
    if (pcccBuildingAlert) {
      const buildingId = pcccBuildingAlert.dataset.pcccBuildingAlert;
      const status = document.querySelector(`[data-pccc-building-status="${buildingId}"]`);
      if (status) status.textContent = 'Đã bật cảnh báo';
      pcccBuildingAlert.textContent = 'Đã bật';
      pcccBuildingAlert.classList.add('is-active');
      const riskStatus = document.querySelector('[data-pccc-risk-status]');
      if (riskStatus) riskStatus.textContent = `Đã bật cảnh báo cho tòa ${buildingId}.`;
      showInfraOpsToast(`Đã bật cảnh báo cho tòa ${buildingId}`);
      return;
    }

    const pcccDispatchOption = event.target.closest('[data-pccc-dispatch-option]');
    if (pcccDispatchOption) {
      const dispatchModal = pcccDispatchOption.closest('[data-pccc-dispatch-modal]');
      const isFire = pcccDispatchOption.dataset.pcccDispatchOption === '114';
      dispatchModal?.querySelectorAll('[data-pccc-dispatch-option]').forEach((option) => {
        option.classList.toggle('smartcity-dispatch-option--active', option === pcccDispatchOption);
      });
      dispatchModal.querySelector('[data-pccc-dispatch-line]').textContent = isFire ? '114 · VOC-12' : '115 · VOC-11';
      dispatchModal.querySelector('[data-pccc-dispatch-type]').textContent = isFire ? 'Cứu hỏa / sơ tán' : 'Y tế khẩn cấp';
      dispatchModal.querySelector('[data-pccc-dispatch-status]').textContent = `Đã chọn ${isFire ? '114 · VOC-12' : '115 · VOC-11'}. Bấm icon điện thoại để gọi.`;
      return;
    }

    const pcccDispatchCall = event.target.closest('[data-pccc-dispatch-call]');
    if (pcccDispatchCall) {
      triggerPcccDispatchCall(pcccDispatchCall.closest('[data-pccc-dispatch-modal]'));
      return;
    }

    if (event.target.closest('[data-pccc-dispatch-submit]')) {
      const dispatchModal = event.target.closest('[data-pccc-dispatch-modal]');
      const status = dispatchModal?.querySelector('[data-pccc-dispatch-status]');
      if (status) status.textContent = 'Đã kết thúc và gửi yêu cầu hỗ trợ tới VOC.';
      showInfraOpsToast('Đã gửi yêu cầu hỗ trợ tới VOC');
      return;
    }

    const pcccPowerZone = event.target.closest('[data-pccc-power-zone]');
    if (pcccPowerZone) {
      pcccPowerZone.classList.toggle('smartcity-power-zone--on');
      pcccPowerZone.classList.toggle('smartcity-power-zone--off');
      const status = pcccPowerZone.closest('[data-pccc-power-modal]')?.querySelector('[data-pccc-power-status]');
      if (status) status.textContent = `Đã cập nhật nguồn khu ${pcccPowerZone.dataset.pcccPowerZone}.`;
      return;
    }

    const pcccModal = event.target.closest('[data-pccc-risk-modal], [data-pccc-sensor-modal], [data-pccc-history-modal], [data-pccc-dispatch-modal], [data-pccc-power-modal], [data-pccc-smoke-modal]');
    if (event.target.closest('[data-pccc-modal-close]') || event.target === pcccModal) {
      pcccModal?.remove();
      return;
    }

    const modal = event.target.closest('[data-infra-ops-modal]');
    if (event.target.closest('[data-infra-ops-close]') || event.target === modal) {
      document.querySelector('[data-infra-ops-modal]')?.remove();
    }
  });
}

function infraPiePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

function infraPiePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${infraPiePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${infraPiePoint(cx, cy, r, end)} Z`;
}

function infrastructureHealthSnapshot() {
  const metrics = [
    { label: 'Khẩn cấp', value: '3', pct: 25 },
    { label: 'Quá hạn', value: '4', pct: 33 },
    { label: 'Đang xử lý', value: '5', pct: 42 },
  ];
  return `<section class="hud-block sc-diagram infra-blue-card" data-diagram-family="infra-health">
    ${hudHead('Tác vụ hạ tầng cần xử lý')}
    <div class="infra-health-viz">
      <div class="infra-health-viz__gauge" style="--pct:92">
        <strong>12</strong><span>việc</span>
      </div>
      <div class="infra-health-viz__bars">
        ${metrics.map((m) => `<span><b>${m.label}</b><i><em style="width:${m.pct}%"></em></i><strong>${m.value}</strong></span>`).join('')}
      </div>
    </div>
    <button type="button" class="infra-health-viz__action" data-infra-task-summary-open>
      <i class="ti ti-list-check"></i><span>Mở danh sách xử lý</span>
    </button>
  </section>`;
}

function environmentNetwork() {
  let angle = -22;
  const slices = [
    { label: 'Mới', value: 43, color: '#00d4ff' },
    { label: 'Đang xử lý', value: 36, color: '#168fff' },
    { label: 'Theo dõi', value: 21, color: '#74c7ff' },
  ].map((item) => {
    const span = item.value * 3.6;
    const path = infraPiePath(58, 58, 45, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = infraPiePoint(58, 58, 33, mid).split(' ');
    const pin = infraPiePoint(58, 58, 56, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="sensor-network">
    ${hudHead('Điểm nóng cần điều phối')}
    <div class="infra-hotspot-summary">
      <svg viewBox="0 0 122 122" aria-hidden="true">
        <ellipse class="infra-hotspot-summary__shadow" cx="58" cy="66" rx="45" ry="34"/>
        ${slices.map((s) => `<path class="infra-hotspot-summary__slice" d="${s.path}" fill="${s.color}"/>`).join('')}
        ${slices.map((s) => `<line class="infra-hotspot-summary__pin" x1="${s.dot[0]}" y1="${s.dot[1]}" x2="${s.pin[0]}" y2="${s.pin[1]}"/>
          <circle class="infra-hotspot-summary__dot" cx="${s.pin[0]}" cy="${s.pin[1]}" r="2.2"/>`).join('')}
        <circle class="infra-hotspot-summary__core" cx="58" cy="58" r="18"/>
        <circle class="infra-hotspot-summary__core-light" cx="58" cy="58" r="9"/>
      </svg>
      <div class="infra-hotspot-summary__legend">
        ${slices.map((item) => `<span><i style="background:${item.color}"></i><b>${item.label}</b><em>${item.value}%</em></span>`).join('')}
      </div>
    </div>
    <div class="infra-hotspot-actions">
      ${infrastructureHotspotItems.map((item) => `<button type="button" data-infra-hotspot="${item.key}">
        <i class="ti ${item.icon}"></i><span>${item.label}</span><b>${item.value}</b>
      </button>`).join('')}
    </div>
  </section>`;
}

const pcccRiskBuildings = [
  { id: 'S1.02', area: 'Tầng 12 · Hành lang', sensor: 'Khói', level: 82, smoke: 64, status: 'Cảnh báo mức cao' },
  { id: 'S2.01', area: 'Tầng B1 · Phòng kỹ thuật', sensor: 'Nhiệt', level: 76, smoke: 48, status: 'Bình chữa cháy hết hạn' },
];

const pcccFireHistory = [
  {
    id: 'F-2026-0611-03',
    time: '11/06 · 09:42',
    location: 'S1.02 · Tầng 12 · Hành lang',
    source: 'Cảm biến khói + camera AI',
    level: 'Cao',
    cause: 'Khói từ khu kỹ thuật điều hòa',
    response: 'Đã hút khói, khóa thang S1-03, đội PCCC xác minh tại chỗ',
    status: 'Đã đóng',
    duration: '18 phút',
  },
  {
    id: 'F-2026-0610-01',
    time: '10/06 · 21:18',
    location: 'S2.01 · Tầng B1 · Phòng kỹ thuật',
    source: 'Nhiệt tăng + cảnh báo tủ điện',
    level: 'Trung bình',
    cause: 'Tủ điện phụ tải nóng bất thường',
    response: 'Cắt tải nhánh phụ, kiểm tra bằng camera nhiệt',
    status: 'Theo dõi',
    duration: '26 phút',
  },
  {
    id: 'F-2026-0608-02',
    time: '08/06 · 14:05',
    location: 'TMDV · Khu bếp nhà hàng',
    source: 'Nút báo cháy thủ công',
    level: 'Thấp',
    cause: 'Khói bếp cục bộ',
    response: 'Xác minh false alarm, reset đầu báo, nhắc đơn vị vận hành',
    status: 'Đã đóng',
    duration: '9 phút',
  },
];

const pcccPowerZones = ['IOC', 'Khu căn hộ A', 'Khu căn hộ B', 'TMDV', 'Hầm xe', 'Công viên', 'Trạm bơm', 'Cổng B2'];

function renderPcccRiskBuildings() {
  return pcccRiskBuildings.map((building) => `<div class="pccc-risk-row" data-pccc-building="${building.id}">
    <div>
      <b>${building.id}</b>
      <span>${building.area}</span>
      <em data-pccc-building-status="${building.id}">${building.status}</em>
    </div>
    <button type="button" data-pccc-building-alert="${building.id}">Bật cảnh báo</button>
  </div>`).join('');
}

function pcccRiskModal() {
  return `<div class="smartcity-action-modal pccc-risk-modal" data-pccc-risk-modal>
    <div class="smartcity-action-modal__panel" role="dialog" aria-modal="true" aria-label="Tòa nhà có nguy cơ cháy nổ">
      <button type="button" class="smartcity-action-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-action-modal__head">
        <span class="smartcity-action-modal__icon"><i class="ti ti-flame"></i></span>
        <div><small>PCCC</small><h3>Tòa nhà có nguy cơ cháy nổ</h3></div>
      </div>
      <p>Danh sách tòa nhà đang có tín hiệu khói, nhiệt hoặc thiết bị PCCC cần kiểm tra. Có thể bật cảnh báo riêng cho từng tòa nhà.</p>
      <div class="pccc-risk-list">${renderPcccRiskBuildings()}</div>
      <div class="smartcity-action-modal__status"><i class="ti ti-broadcast"></i><span data-pccc-risk-status>Chờ chọn tòa nhà để bật cảnh báo.</span></div>
    </div>
  </div>`;
}

function pcccSensorModal() {
  return `<div class="smartcity-smoke-modal pccc-sensor-modal" data-pccc-sensor-modal>
    <div class="smartcity-smoke-modal__panel" role="dialog" aria-modal="true" aria-label="Cảm biến cháy nổ">
      <button type="button" class="smartcity-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-modal__icon"><i class="ti ti-flame"></i></span>
        <div><small>FIRE SENSOR</small><h3>Cảm biến cháy nổ</h3></div>
      </div>
      <div class="pccc-sensor-grid">
        ${[
    ['Nhiệt', 82],
    ['Khói', 64],
    ['Gas', 38],
    ['Điện', 52],
  ].map(([label, value]) => `<div class="event-fire-bar event-fire-bar--${value > 70 ? 'hot' : value > 45 ? 'warn' : 'ok'}">
          <span>${label}</span><div class="event-fire-bar__track"><i style="height:${value}%"></i></div><b>${value}%</b>
        </div>`).join('')}
      </div>
      <p data-pccc-sensor-status>Cảm biến đang giám sát S1.02 và S2.01 theo thời gian thực.</p>
      <div class="smartcity-modal__steps">
        <span><b>01</b>Ghim camera tầng nguy cơ</span><span><b>02</b>Báo ca trực PCCC</span><span><b>03</b>Theo dõi khói/nhiệt</span>
      </div>
    </div>
  </div>`;
}

function pcccHistoryModal() {
  return `<div class="smartcity-action-modal pccc-history-modal" data-pccc-history-modal>
    <div class="smartcity-action-modal__panel" role="dialog" aria-modal="true" aria-label="Lịch sử hỏa hoạn">
      <button type="button" class="smartcity-action-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-action-modal__head">
        <span class="smartcity-action-modal__icon"><i class="ti ti-history"></i></span>
        <div><small>FIRE HISTORY</small><h3>Lịch sử hỏa hoạn</h3></div>
      </div>
      <div class="pccc-history-summary">
        <span><b>${pcccFireHistory.length}</b><em>Sự kiện gần đây</em></span>
        <span><b>2</b><em>Đã đóng</em></span>
        <span><b>1</b><em>Đang theo dõi</em></span>
        <span><b>18p</b><em>MTTR trung bình</em></span>
      </div>
      <div class="pccc-history-list">
        ${pcccFireHistory.map((item) => `<article class="pccc-history-item pccc-history-item--${item.level === 'Cao' ? 'high' : item.level === 'Trung bình' ? 'medium' : 'low'}">
          <header>
            <div><b>${item.id}</b><strong>${item.location}</strong></div>
            <span>${item.status}</span>
          </header>
          <div class="pccc-history-item__grid">
            <p><em>Thời gian</em><b>${item.time}</b></p>
            <p><em>Mức độ</em><b>${item.level}</b></p>
            <p><em>Nguồn phát hiện</em><b>${item.source}</b></p>
            <p><em>Thời lượng</em><b>${item.duration}</b></p>
          </div>
          <div class="pccc-history-item__detail">
            <span><b>Nguyên nhân</b><em>${item.cause}</em></span>
            <span><b>Xử lý</b><em>${item.response}</em></span>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </div>`;
}

function pcccDispatchModal({ auto = false } = {}) {
  return `<div class="smartcity-dispatch-modal pccc-dispatch-modal" data-pccc-dispatch-modal>
    <div class="smartcity-dispatch-modal__panel" role="dialog" aria-modal="true" aria-label="Gọi Y tế / Cứu hỏa">
      <button type="button" class="smartcity-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-dispatch-icon"><i class="ti ti-phone-call"></i></span>
        <div><small>VOC EMERGENCY DISPATCH</small><h3>Gọi Y tế / Cứu hỏa</h3></div>
      </div>
      <strong class="smartcity-dispatch-label">Ưu tiên 1 · Chọn tổng đài gọi ngay</strong>
      <div class="smartcity-dispatch-options">
        <button type="button" data-pccc-dispatch-option="115"><i class="ti ti-first-aid-kit"></i><span>Y tế khẩn cấp</span><b>115 · VOC-11</b></button>
        <button type="button" class="smartcity-dispatch-option--active" data-pccc-dispatch-option="114"><i class="ti ti-flame"></i><span>Cứu hỏa / sơ tán</span><b>114 · VOC-12</b></button>
      </div>
      <div class="smartcity-dispatch-ready" data-pccc-dispatch-call>
        <i class="ti ti-phone-call"></i>
        <span><em>Sẵn sàng gọi</em><strong data-pccc-dispatch-line>114 · VOC-12</strong><b data-pccc-dispatch-type>Cứu hỏa / sơ tán</b></span>
        <small>CHỜ GỌI</small>
      </div>
      <label class="smartcity-dispatch-note">
        <span>Vấn đề cần hỗ trợ</span>
        <textarea data-pccc-dispatch-note placeholder="Ví dụ: Khu TMDV có khói, cần hỗ trợ cứu hỏa và sơ tán.">${auto ? 'Auto PCCC: đã cắt điện, đã hút khói khu nguy cơ, yêu cầu cứu hỏa / sơ tán xác nhận tiếp nhận.' : ''}</textarea>
      </label>
      <div class="smartcity-dispatch-record"><b>Tùy chọn 2</b><button type="button"><i class="ti ti-microphone"></i>Ghi âm mô tả</button><span>Chưa ghi âm</span></div>
      <div class="smartcity-modal__status"><i class="ti ti-phone-call"></i><span data-pccc-dispatch-status>${auto ? 'Đã chọn 114 · VOC-12 từ Auto PCCC. Sẵn sàng gọi cứu hỏa / sơ tán.' : 'Đã chọn 114 · VOC-12. Bấm icon điện thoại để gọi. Ghi âm là tùy chọn nếu cần mô tả thêm.'}</span></div>
      <button type="button" class="smartcity-dispatch-submit" data-pccc-dispatch-submit><i class="ti ti-send"></i>Kết thúc & gửi yêu cầu</button>
    </div>
  </div>`;
}

function pcccPowerModal({ auto = false } = {}) {
  const zoneItems = pcccPowerZones.map((name) => `<button type="button" class="smartcity-power-zone smartcity-power-zone--on" data-pccc-power-zone="${name}">
    <i></i><b>${name}</b>
  </button>`).join('');
  return `<div class="smartcity-power-modal pccc-power-modal" data-pccc-power-modal>
    <div class="smartcity-power-modal__panel" role="dialog" aria-modal="true" aria-label="Cắt điện toàn thành phố">
      <button type="button" class="smartcity-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head smartcity-power-modal__head">
        <span class="smartcity-power-button"><i class="ti ti-power"></i></span>
        <div><small>POWER CONTROL</small><h3>Cắt điện toàn thành phố</h3></div>
      </div>
      <p>Bạn có chắc chắn muốn cắt điện? Điều này sẽ cắt điện toàn thành phố, chia theo từng khu để giữ nguồn ưu tiên.</p>
      <div class="smartcity-power-zones">${zoneItems}</div>
      <div class="smartcity-modal__status"><i class="ti ti-bolt"></i><span data-pccc-power-status>${auto ? 'Đang cắt điện toàn thành phố...' : 'Chờ xác nhận thao tác nguồn.'}</span></div>
    </div>
  </div>`;
}

function pcccSmokeModal() {
  return `<div class="smartcity-smoke-modal pccc-smoke-modal" data-pccc-smoke-modal>
    <div class="smartcity-smoke-modal__panel" role="dialog" aria-modal="true" aria-label="Hút khói khu nguy cơ">
      <button type="button" class="smartcity-modal__close" data-pccc-modal-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="smartcity-modal__head">
        <span class="smartcity-modal__icon"><i class="ti ti-wind"></i></span>
        <div><small>SMOKE EXTRACT</small><h3>Hút khói khu nguy cơ</h3></div>
      </div>
      <div class="smartcity-smoke-gauge">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r="52"></circle>
          <circle data-pccc-smoke-ring cx="70" cy="70" r="52"></circle>
        </svg>
        <strong><span data-pccc-smoke-pct>0</span>%</strong>
      </div>
      <p data-pccc-smoke-status>Đang khởi động quạt hút khói và mở tuyến thoát khí.</p>
      <div class="smartcity-modal__steps">
        <span><b>01</b>Tầng 12 hút khói</span><span><b>02</b>Áp âm hành lang</span><span><b>03</b>Theo dõi cảm biến</span>
      </div>
    </div>
  </div>`;
}

function environmentRadar() {
  const bars = [
    { label: 'Nhiệt', value: 82 },
    { label: 'Khói', value: 64 },
    { label: 'Gas', value: 38 },
    { label: 'Điện', value: 52 },
  ];
  return `<section class="hud-block event-fire-trend event-risk--fire pccc-fire-card" data-diagram-family="pccc-fire">
    ${hudHead('Phòng cháy chữa cháy')}
    <div class="event-fire-bars">${bars.map((bar) =>
    `<div class="event-fire-bar event-fire-bar--${bar.value > 70 ? 'hot' : bar.value > 45 ? 'warn' : 'ok'}">
      <span>${bar.label}</span><div class="event-fire-bar__track"><i style="height:${bar.value}%"></i></div><b>${bar.value}%</b>
    </div>`).join('')}</div>
    <div class="event-fire-auto">
      <button type="button" class="event-fire-auto__button" data-pccc-open="auto" aria-label="Kích hoạt Auto PCCC">
        <i class="ti ti-shield-bolt"></i>
        <span>Auto PCCC</span>
      </button>
      <p data-pccc-card-status>2 tòa nhà có nguy cơ cháy nổ</p>
    </div>
    <div class="event-risk__actions pccc-fire-controls">
      <button type="button" class="event-risk__btn" data-pccc-open="alarm">
        <i class="ti ti-flame"></i><span>Báo cháy</span>
      </button>
      <button type="button" class="event-risk__btn" data-pccc-open="smoke">
        <i class="ti ti-wind"></i><span>Hút khói</span>
      </button>
      <button type="button" class="event-risk__btn" data-pccc-open="power">
        <i class="ti ti-power"></i><span>Cắt điện</span>
      </button>
    </div>
  </section>`;
}

function pcccFireRiskNetwork() {
  const nodes = [
    { label: 'S1', value: '82', tone: 'hot' },
    { label: 'S2', value: '76', tone: 'hot' },
    { label: 'B1', value: '54', tone: 'watch' },
    { label: 'TMDV', value: '48', tone: 'watch' },
    { label: 'Hầm', value: '43', tone: 'watch' },
    { label: 'Kho', value: '38', tone: 'idle' },
  ].map((node, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return { ...node, x: 50 + Math.cos(angle) * 36, y: 50 + Math.sin(angle) * 31 };
  });
  return `<section class="hud-block sc-diagram pccc-risk-network" data-diagram-family="pccc-risk-network">
    ${hudHead('Nguy cơ cháy nổ')}
    <div class="pccc-risk-network__map">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="pccc-risk-network__halo" cx="50" cy="50" r="19"/>
        <circle class="pccc-risk-network__hub" cx="50" cy="50" r="7"/>
        ${nodes.map((n) => `<line class="pccc-risk-network__line pccc-risk-network__line--${n.tone}" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="pccc-risk-network__node pccc-risk-network__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.4"/>`).join('')}
      </svg>
      <div class="pccc-risk-network__legend">
        ${nodes.slice(0, 3).map((n) => `<span><b>${n.label}</b><em>${n.value}%</em></span>`).join('')}
      </div>
    </div>
    <div class="event-risk__actions pccc-fire-actions pccc-risk-network__actions">
      <button type="button" class="event-risk__btn" data-pccc-open="risk">
        <i class="ti ti-building"></i><span>Xem tòa nhà nguy cơ</span>
      </button>
      <button type="button" class="event-risk__btn" data-pccc-open="history">
        <i class="ti ti-history"></i><span>Lịch sử hỏa hoạn</span>
      </button>
    </div>
  </section>`;
}

function environmentLoadMatrix() {
  const cols = infrastructureSlaItems;
  return `<section class="hud-block sc-diagram infra-sla-card" data-diagram-family="load-matrix">
    ${hudHead('SLA xử lý theo ca')}
    <p class="infra-sla-benefit">Biết nhóm nào sắp trễ SLA để đổi người ngay trong ca, trước khi phát sinh ticket quá hạn.</p>
    <div class="infra-sla-bars">
      ${cols.map((col) => `<div class="sc-load-col">
        <b>${col.value}%</b>
        <i style="height:${col.visual}%"></i>
        <span>${col.display}</span>
      </div>`).join('')}
    </div>
    <div class="infra-sla-actions">
      <button type="button" data-infra-sla-open="risk"><i class="ti ti-chart-dots"></i><span>Xem điểm nghẽn</span></button>
      <button type="button" data-infra-sla-open="rebalance"><i class="ti ti-users-group"></i><span>Gợi ý cân ca</span></button>
    </div>
  </section>`;
}

function utilityNodeMap() {
  const nodes = [
    { id: 'fee', label: 'Phí dịch vụ', value: '900k', icon: 'ti-home-dollar', tone: 'power' },
    { id: 'waterpark', label: 'Waterpark', value: '64k', icon: 'ti-swimming', tone: 'water' },
    { id: 'safari', label: 'Safari', value: '21k', icon: 'ti-paw', tone: 'water' },
    { id: 'grandworld', label: 'Grand World', value: '46k', icon: 'ti-building-carousel', tone: 'media' },
    { id: 'vinbus', label: 'VinBus nội khu', value: '128k', icon: 'ti-bus', tone: 'power' },
    { id: 'vinmec', label: 'Vinmec', value: '7.8k', icon: 'ti-first-aid-kit', tone: 'water' },
  ].map((node, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return { ...node, x: 50 + Math.cos(angle) * 37, y: 50 + Math.sin(angle) * 32 };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="utility-node-map">
    ${hudHead('Mạng dịch vụ Vin')}
    <div class="sc-node-map sc-node-map--utility">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect class="sc-node-map__pitch" x="35" y="37" width="30" height="26" rx="13"/>
        <circle class="sc-node-map__hub" cx="50" cy="50" r="7"/>
        ${nodes.map((n) => `<path class="sc-node-map__line sc-node-map__line--${n.tone}" d="M50 50L${n.x.toFixed(1)} ${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-node-map__node sc-node-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.2"/>`).join('')}
      </svg>
      <div class="sc-node-map__labels">
        ${nodes.map((n) => `<button type="button" class="sc-node-label sc-node-label--${n.tone}" data-vin-service-open="${n.id}">
          <i class="ti ${n.icon}"></i><span class="sc-node-label__text"><b>${n.label}</b><em>${n.value}</em></span>
        </button>`).join('')}
      </div>
    </div>
  </section>`;
}

const vinServiceModalData = {
  usage: {
    tag: 'Lượt sử dụng 6 tháng',
    icon: 'ti-chart-line',
    title: 'Chi tiết lượt sử dụng dịch vụ Vin',
    summary: 'Tổng hợp mức sử dụng các dịch vụ cư dân trong 6 tháng gần nhất, gồm WaterPark, VinBus nội khu, Grand World, Vinmec và thao tác qua app cư dân.',
    stats: [['Đỉnh sử dụng', 'T5 · 88%'], ['Lượt dịch vụ', '64k'], ['Phản ánh', '146']],
    steps: ['So sánh nhu cầu theo tháng để phát hiện mùa cao điểm', 'Tách nhóm dịch vụ đông: WaterPark, VinBus, Grand World', 'Mở điều phối khi tỷ lệ sử dụng vượt 84% hoặc phản ánh tăng'],
  },
  fee: {
    tag: 'Phí dịch vụ',
    icon: 'ti-home-dollar',
    title: 'Phí dịch vụ cư dân',
    summary: 'Theo dõi phí 900k/tháng/nhà, trạng thái đóng phí và quyền dùng các dịch vụ Vin trong tháng.',
    stats: [['Mức phí', '900k/nhà'], ['Hộ đã đóng', '18.420'], ['Nhắc phí', '312 căn']],
    steps: ['Đối soát căn hộ chưa đóng', 'Gửi nhắc phí qua app cư dân', 'Đồng bộ quyền dịch vụ trong ngày'],
  },
  waterpark: {
    tag: 'VinWonders WaterPark',
    icon: 'ti-swimming',
    title: 'VinWonders WaterPark',
    summary: 'Quản lý lượt cư dân và khách ngoài cư dân sử dụng WaterPark theo tháng, kèm vi phạm khung giờ.',
    stats: [['Cư dân', '38k'], ['Không cư dân', '26k'], ['Vi phạm', '54 lượt']],
    steps: ['Kiểm tra QR cư dân', 'Theo dõi lượt vượt khung giờ', 'Cân lịch ưu đãi cuối tuần'],
  },
  safari: {
    tag: 'VinWonders Safari',
    icon: 'ti-paw',
    title: 'VinWonders Safari',
    summary: 'Theo dõi quyền ưu đãi Safari cho cư dân và khách ngoài khu, tập trung đối soát lượt dùng sai nhóm.',
    stats: [['Cư dân', '15k'], ['Không cư dân', '6k'], ['Vi phạm', '18 lượt']],
    steps: ['Đối soát voucher cư dân', 'Ghim lượt dùng sai nhóm', 'Gửi báo cáo cho vận hành VinWonders'],
  },
  grandworld: {
    tag: 'Grand World',
    icon: 'ti-building-carousel',
    title: 'Grand World',
    summary: 'Giám sát lượng sử dụng tiện ích vui chơi, mua sắm và sự kiện Grand World từ nhóm cư dân Vin.',
    stats: [['Cư dân', '31k'], ['Không cư dân', '15k'], ['Vi phạm', '31 lượt']],
    steps: ['Theo dõi lượt vào theo khung giờ', 'Phân nhóm cư dân/khách', 'Cập nhật điểm nóng sự kiện'],
  },
  vinbus: {
    tag: 'VinBus',
    icon: 'ti-bus',
    title: 'VinBus nội khu',
    summary: 'Theo dõi lượt sử dụng VinBus, mật độ tuyến nội khu và nhu cầu tăng chuyến trong giờ cao điểm.',
    stats: [['Lượt tháng', '128k'], ['Tuyến chính', '6'], ['Vi phạm', '26 lượt']],
    steps: ['Tăng chuyến cuối tuần', 'Theo dõi điểm dừng đông', 'Đồng bộ cảnh báo lên app cư dân'],
  },
  vinmec: {
    tag: 'Vinmec',
    icon: 'ti-first-aid-kit',
    title: 'Vinmec cư dân',
    summary: 'Theo dõi lượt đặt lịch, khám ưu tiên và hỗ trợ y tế cho cư dân qua hệ sinh thái Vinmec.',
    stats: [['Lượt tháng', '7.8k'], ['Ưu tiên cư dân', '92%'], ['Vi phạm', '5 lượt']],
    steps: ['Xác thực quyền ưu tiên', 'Theo dõi khung giờ quá tải', 'Đẩy nhắc lịch qua app cư dân'],
  },
};

function renderVinServiceModal(service) {
  return `<div class="vin-service-modal" data-vin-service-modal>
    <div class="vin-service-modal__panel" role="dialog" aria-modal="true" aria-label="${service.title}">
      <button type="button" class="vin-service-modal__close" data-vin-service-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="vin-service-modal__head">
        <span><i class="ti ${service.icon}"></i></span>
        <div><small>${service.tag}</small><h3>${service.title}</h3></div>
      </header>
      <p class="vin-service-modal__summary">${service.summary}</p>
      <div class="vin-service-modal__stats">
        ${service.stats.map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`).join('')}
      </div>
      <section class="vin-service-modal__steps">
        ${service.steps.map((step, index) => `<span><i>${index + 1}</i><b>${step}</b></span>`).join('')}
      </section>
      <footer class="vin-service-modal__foot">
        <span>Đã đồng bộ dữ liệu dịch vụ tháng hiện tại.</span>
        <button type="button" data-vin-service-close>Đóng</button>
      </footer>
    </div>
  </div>`;
}

function showVinServiceModal(id) {
  const service = vinServiceModalData[id];
  if (!service) return;
  document.querySelector('[data-vin-service-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderVinServiceModal(service));
}

function utilityServiceMap() {
  const lots = [
    { label: 'WaterPark', value: 86, metric: '38k/26k', tone: 'ok' },
    { label: 'Safari', value: 72, metric: '15k/6k', tone: 'ok' },
    { label: 'GrandWorld', value: 79, metric: '31k/15k', tone: 'ok' },
    { label: 'Marina', value: 64, metric: '9k/5k', tone: 'ok' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="service-map">
    ${hudHead('Cư dân / khách theo tháng')}
    <div class="sc-service-map">
      <div class="sc-service-map__top">
        <div class="sc-service-map__ring" style="--pct:86"><strong>86%</strong><span>cư dân</span></div>
        <div class="sc-service-map__bars">
          ${lots.map((lot) => `<span><b>${lot.label}</b><em><i style="width:${lot.value}%"></i></em><strong>${lot.metric}</strong></span>`).join('')}
        </div>
      </div>
      <svg viewBox="0 0 100 82" aria-hidden="true">
        <path class="sc-service-map__road" d="M8 40h84M50 8v66"/>
        <rect class="sc-service-map__core" x="35" y="27" width="30" height="26" rx="13"/>
        ${lots.map((lot, index) => {
    const x = [10, 60, 10, 60][index];
    const y = [10, 10, 52, 52][index];
    return `<g class="sc-service-lot sc-service-lot--${lot.tone}">
      <rect x="${x}" y="${y}" width="28" height="18" rx="3"/>
      <text x="${x + 14}" y="${y + 11}">${lot.label.replace('GrandWorld', 'G.World').replace('WaterPark', 'Water')}</text>
    </g>`;
  }).join('')}
      </svg>
    </div>
  </section>`;
}

function utilityFlow() {
  const checks = [
    { label: 'App cư dân', value: 'OK', tone: 'ok' },
    { label: 'QR vé', value: '99.2%', tone: 'ok' },
    { label: 'Phân luồng', value: 'Live', tone: 'ok' },
    { label: 'Vi phạm', value: '146', tone: 'ok' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="route-flow">
    ${hudHead('Luồng vào dịch vụ cư dân')}
    <div class="sc-route-flow">
      <svg viewBox="0 0 160 68" aria-hidden="true">
        <path class="sc-route-flow__route" d="M12 18h54l20 16h62"/>
        <path class="sc-route-flow__route sc-route-flow__route--alt" d="M12 50h58l16-16"/>
        <circle class="sc-route-flow__node" cx="20" cy="18" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--warn" cx="86" cy="34" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--ok" cx="140" cy="34" r="7"/>
        <text x="20" y="21">APP</text><text x="86" y="37">QR</text><text x="140" y="37">VIN</text>
      </svg>
      <div class="sc-route-flow__checks">
        ${checks.map((check) => `<span class="sc-route-check sc-route-check--${check.tone}"><b>${check.label}</b><em>${check.value}</em></span>`).join('')}
      </div>
    </div>
  </section>`;
}

function utilityLoadTowers() {
  const bars = [
    { label: 'T1', value: 52, note: 'App' },
    { label: 'T2', value: 61, note: 'VinBus' },
    { label: 'T3', value: 73, note: 'Water' },
    { label: 'T4', value: 79, note: 'G.World' },
    { label: 'T5', value: 88, note: 'Cao điểm' },
    { label: 'T6', value: 67, note: 'Ổn định' },
  ];
  const services = [
    ['WaterPark', '64k'],
    ['VinBus', '128k'],
    ['Grand World', '46k'],
    ['App cư dân', '99.2%'],
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="queue-bars">
    ${hudHead('Lượt sử dụng 6 tháng')}
    <div class="vin-usage-summary">
      <span>Chỉ số tổng hợp từ các dịch vụ cư dân</span>
      <strong>T5 cao nhất</strong>
    </div>
    <div class="sc-queue-bars">
      ${bars.map((bar) => `<span class="sc-queue-bar sc-queue-bar--${bar.value >= 84 ? 'warn' : 'ok'}">
        <em>${bar.label}</em><i style="height:${bar.value}%"></i><b>${bar.value}%</b><small>${bar.note}</small>
      </span>`).join('')}
    </div>
    <div class="vin-usage-legend">
      ${services.map(([label, value]) => `<span><b>${label}</b><em>${value}</em></span>`).join('')}
    </div>
    <button type="button" class="vin-usage-open" data-vin-service-open="usage">
      <i class="ti ti-chart-line"></i><span>Xem chi tiết lượt dùng</span>
    </button>
  </section>`;
}

function vinServiceRadar(values, labels) {
  const cx = 56;
  const cy = 52;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, 42 * v)).join(' ');
  return `<svg class="vin-service-radar" viewBox="0 0 112 108" aria-hidden="true">
    <defs><linearGradient id="vinServiceRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="vin-service-radar__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(29)}"/><polygon points="${ring(42)}"/>
      ${labels.map((label, i) => {
    const [x, y] = point(i, 50).split(',');
    const [ax, ay] = point(i, 42).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"/><text x="${x}" y="${y}">${label}</text>`;
  }).join('')}
    </g>
    <polygon class="vin-service-radar__shadow" points="${data}"/>
    <polygon class="vin-service-radar__shape" points="${data}"/>
  </svg>`;
}

function utilityRulesRadar() {
  const violations = [
    { label: 'Water', value: 54, tone: 'hot' },
    { label: 'Safari', value: 18, tone: 'ok' },
    { label: 'G.World', value: 31, tone: 'warn' },
    { label: 'Beach', value: 12, tone: 'ok' },
    { label: 'VinBus', value: 26, tone: 'warn' },
    { label: 'Vincom', value: 5, tone: 'ok' },
  ];
  const peak = Math.max(...violations.map((item) => item.value));
  return `<section class="hud-block sc-diagram" data-diagram-family="lux-grid">
    ${hudHead('Vi phạm quy định / tháng')}
    <div class="vin-service-rules">
      ${vinServiceRadar(violations.map((item) => item.value / peak), violations.map((item) => item.label))}
      <div class="vin-service-rules__meter">
        <strong>${peak}</strong>
        <span>WaterPark cao nhất</span>
      </div>
    </div>
    <div class="vin-service-rules__lanes">
      ${violations.map((item) => `<span class="vin-service-rules__lane vin-service-rules__lane--${item.tone}">
        <b>${item.label}</b><i style="width:${Math.max(12, item.value / peak * 100)}%"></i><em>${item.value} VP</em>
      </span>`).join('')}
    </div>
  </section>`;
}

function vinServicePie(items) {
  let angle = -22;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices = items.map((item) => {
    const span = item.value / total * 360;
    const path = infraPiePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = infraPiePoint(58, 58, 34, mid).split(' ');
    const pin = infraPiePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<div class="traffic-viz-pie resident-viz-pie vin-service-pie">
    <svg viewBox="0 0 122 122" aria-hidden="true">
      <ellipse class="traffic-viz-pie__shadow" cx="58" cy="66" rx="45" ry="35"/>
      ${slices.map((s) => `<path class="traffic-viz-pie__slice" d="${s.path}" fill="${s.color}"/>`).join('')}
      ${slices.map((s) => `<line class="traffic-viz-pie__pin" x1="${s.dot[0]}" y1="${s.dot[1]}" x2="${s.pin[0]}" y2="${s.pin[1]}"/>
        <circle class="traffic-viz-pie__dot" cx="${s.pin[0]}" cy="${s.pin[1]}" r="2.2"/>
        <circle class="traffic-viz-pie__dot traffic-viz-pie__dot--inner" cx="${s.dot[0]}" cy="${s.dot[1]}" r="1.8"/>`).join('')}
      <circle class="traffic-viz-pie__core" cx="58" cy="58" r="18"/>
      <circle class="traffic-viz-pie__core-light" cx="58" cy="58" r="9"/>
    </svg>
    <div class="traffic-viz-legend">
      ${items.map((item) => `<span><i style="background:${item.color}"></i><b>${item.label}</b><em>${item.pct}%</em></span>`).join('')}
    </div>
  </div>`;
}

function utilityVinStandard() {
  const items = [
    { label: 'Đóng phí', value: 18420, pct: 58, color: '#00d4ff' },
    { label: 'Water cư dân', value: 38000, pct: 24, color: '#85b7eb' },
    { label: 'Water khách', value: 26000, pct: 16, color: '#185fa5' },
    { label: 'Vi phạm', value: 146, pct: 2, color: '#2b7fc3' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="vin-service-pie">
    ${hudHead('Chuẩn dịch vụ Vin')}
    ${vinServicePie(items)}
  </section>`;
}

function reportSummary() {
  return `<section class="hud-block sc-diagram" data-diagram-family="report-summary">
    ${hudHead('Báo cáo vận hành')}
    <div class="sc-report-summary">
      <div class="sc-report-summary__ring" style="--pct:92"><strong>92%</strong><span>SLA đô thị</span></div>
      <div class="sc-report-summary__chips">
        <span><b>42.318</b><em>Cư dân hiện diện</em></span>
        <span><b>96%</b><em>PCCC sẵn sàng</em></span>
        <span><b>128</b><em>Camera online</em></span>
        <span class="sc-report-summary__warn"><b>85%</b><em>Hạ tầng ổn định</em></span>
      </div>
    </div>
  </section>`;
}

const smartReportCases = [
  {
    id: 'SC-016-2026',
    time: '17:44',
    title: 'Auto PCCC đã kích hoạt',
    summary: 'Dashboard đã cắt điện tầng nguy cơ, hút khói và gửi đội PCCC kiểm tra tủ điện C4.',
    owner: 'Phụ trách PCCC',
    status: 'Chưa giải quyết',
    phase: 'open',
    tone: 'danger',
    attempts: 1,
    action: 'Khóa tải & điều đội PCCC',
    route: ['Auto PCCC', 'Tủ điện C4', 'Đội PCCC'],
    metrics: [['Rủi ro', 'Cao'], ['ETA', '4 ph'], ['Ảnh hưởng', '2 tòa']],
    steps: ['Cắt điện tầng nguy cơ', 'Bật hút khói và mở lối thoát hiểm', 'Giao đội PCCC xác nhận hiện trường'],
  },
  {
    id: 'SC-015-2026',
    time: '17:28',
    title: 'Mở tuyến xử lý hạ tầng',
    summary: 'Người vận hành mở tuyến xử lý cho cảm biến áp suất bất thường tại trạm bơm nước.',
    owner: 'Đội hạ tầng',
    status: 'Đang giải quyết',
    phase: 'processing',
    tone: 'warn',
    attempts: 2,
    action: 'Gửi đội hiện trường',
    route: ['IOC', 'Trạm bơm', 'Kỹ thuật'],
    metrics: [['Áp suất', 'Cao'], ['SLA', '12 ph'], ['Đội', '2 người']],
    steps: ['Khóa van theo cảnh báo BMS', 'Gửi đội hiện trường đến trạm bơm', 'Cập nhật SLA sau khi ổn định'],
  },
  {
    id: 'SC-014-2026',
    time: '16:55',
    title: 'Đảo luồng giao thông A4',
    summary: 'Dashboard giao thông đã kích hoạt kịch bản đảo luồng và điều chỉnh chu kỳ đèn khu A4/B2.',
    owner: 'Trực giao thông',
    status: 'Đang giải quyết',
    phase: 'processing',
    tone: 'warn',
    attempts: 1,
    action: 'Kích hoạt phương án đèn',
    route: ['Camera AI', 'Nút A4', 'Đèn B2'],
    metrics: [['Tải', '78%'], ['Chu kỳ', '12p'], ['Camera', '128']],
    steps: ['Gửi lệnh ưu tiên đèn xanh', 'Bật PA hướng dẫn luồng xe', 'Theo dõi camera AI trong 15 phút'],
  },
  {
    id: 'SC-013-2026',
    time: '15:40',
    title: 'Dịch vụ VinBus vượt ngưỡng',
    summary: 'Người vận hành mở chi tiết lượt dùng và điều phối VinBus do lượt sử dụng đạt 128k.',
    owner: 'Điều phối dịch vụ',
    status: 'Chưa giải quyết',
    phase: 'open',
    tone: 'danger',
    attempts: 1,
    action: 'Mở điều phối VinBus',
    route: ['Dịch vụ Vin', 'VinBus', 'App cư dân'],
    metrics: [['Lượt dùng', '128k'], ['QR', '99.2%'], ['Phản ánh', '146']],
    steps: ['Tách nhóm tuyến quá tải', 'Gửi điều phối xe tăng cường', 'Cập nhật thông báo qua app cư dân'],
  },
  {
    id: 'SC-012-2026',
    time: '14:10',
    title: 'Checklist báo cáo điều hành đã đóng',
    summary: 'Bảng báo cáo đã tổng hợp KPI hạ tầng, SLA và luồng gửi cấp trên trong ca vận hành.',
    owner: 'Trung tam IOC',
    status: 'Đã giải quyết',
    phase: 'resolved',
    tone: 'ok',
    attempts: 1,
    action: 'Xem biên bản',
    route: ['KPI', 'Checklist', 'Gửi QLĐT'],
    metrics: [['SLA', '94%'], ['Case', '42'], ['Gửi', '20:30']],
    steps: ['Đối chiếu KPI vận hành', 'Khép vòng case cần theo dõi', 'Lưu báo cáo vào dashboard'],
  },
  {
    id: 'SC-011-2026',
    time: '13:35',
    title: 'Camera AI an ninh đã xử lý cảnh báo',
    summary: 'Cảnh báo từ camera AI được gắn đội phản ứng và điểm nóng đã xác nhận an toàn.',
    owner: 'Trực an ninh',
    status: 'Đã giải quyết',
    phase: 'resolved',
    tone: 'ok',
    attempts: 1,
    action: 'Mở lại camera',
    route: ['Camera AI', 'Đội #03', 'IOC'],
    metrics: [['Camera', '96/96'], ['ETA', '6 ph'], ['SLA', 'Đúng']],
    steps: ['Xác minh lại vùng cảnh báo', 'Gắn đội phản ứng', 'Đóng cảnh báo sau khi an toàn'],
  },
];

function smartReportPhase(item) {
  return item.phase || 'open';
}

function smartReportCaseList(items = smartReportCases, filter = 'all') {
  const filtered = items.filter((item) => filter === 'all' || smartReportPhase(item) === filter);
  if (!filtered.length) return '<div class="smart-report-history-modal__empty">Không có báo cáo trong nhóm này.</div>';
  return filtered.map((item) => {
    const isResolved = smartReportPhase(item) === 'resolved';
    const action = isResolved
      ? '<span class="smart-report-case__closed"><i class="ti ti-check"></i>Đã đóng</span>'
      : `<button type="button" class="smart-report-case__resolve" data-smart-report-resolve="${item.id}">
          <i class="ti ti-tool"></i><span>Kích hoạt</span>
        </button>`;
    const escalate = !isResolved && item.attempts >= 2
      ? `<button type="button" class="smart-report-case__escalate" data-smart-report-escalate="${item.id}">
          <i class="ti ti-message-report"></i><span>Đẩy điều phối</span>
        </button>`
      : '';
    return `<article class="smart-report-case smart-report-case--${item.tone}" data-smart-report-case="${item.id}">
      <div class="smart-report-case__main">
        <small>${item.id} · ${item.time}</small>
        <strong>${item.title}</strong>
        <p>${item.summary}</p>
      </div>
      <div class="smart-report-case__meta">
        <span>Lần ${item.attempts}</span>
        <span>${item.owner}</span>
        <b>${item.status}</b>
      </div>
      <div class="smart-report-case__actions">${action}${escalate}</div>
      <div class="smart-report-case__status" data-smart-report-case-status hidden></div>
    </article>`;
  }).join('');
}

function smartReportHistoryModal() {
  const allCount = smartReportCases.length;
  const openCount = smartReportCases.filter((item) => smartReportPhase(item) === 'open').length;
  const processingCount = smartReportCases.filter((item) => smartReportPhase(item) === 'processing').length;
  const resolvedCount = smartReportCases.filter((item) => smartReportPhase(item) === 'resolved').length;
  const payload = encodeURIComponent(JSON.stringify(smartReportCases));
  return `<div class="smart-report-history-modal" data-smart-report-history-modal hidden>
    <div class="smart-report-history-modal__panel" role="dialog" aria-modal="true" aria-label="Lịch sử báo cáo Smart City">
      <button type="button" class="smart-report-history-modal__close" data-smart-report-history-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <h3>Lịch sử báo cáo Smart City</h3>
      <p>Theo dõi các báo cáo đã gửi và những thao tác đã kích hoạt trên dashboard: PCCC, hạ tầng, giao thông, dịch vụ Vin, an ninh và KPI.</p>
      <div class="smart-report-history-modal__tabs" data-smart-report-history-tabs>
        <button type="button" class="hud-tab hud-tab--active" data-smart-report-history-tab="all">Tất cả <b>${allCount}</b></button>
        <button type="button" class="hud-tab" data-smart-report-history-tab="open">Chưa giải quyết <b>${openCount}</b></button>
        <button type="button" class="hud-tab" data-smart-report-history-tab="processing">Đang giải quyết <b>${processingCount}</b></button>
        <button type="button" class="hud-tab" data-smart-report-history-tab="resolved">Đã giải quyết <b>${resolvedCount}</b></button>
      </div>
      <div class="smart-report-history-modal__list" data-smart-report-history-panel data-smart-report-cases="${payload}">${smartReportCaseList(smartReportCases, 'all')}</div>
    </div>
  </div>
  <div class="smart-report-action-modal" data-smart-report-action-modal hidden>
    <div class="smart-report-action-modal__panel" role="dialog" aria-modal="true" aria-label="Kích hoạt thao tác Smart City">
      <button type="button" class="smart-report-history-modal__close" data-smart-report-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="smart-report-action-modal__head">
        <span><i class="ti ti-broadcast"></i></span>
        <div><small data-smart-report-action-tag>Luồng thao tác</small><h3 data-smart-report-action-title>Kích hoạt dashboard</h3><p data-smart-report-action-summary></p></div>
      </header>
      <div class="smart-report-action-modal__route" data-smart-report-action-route></div>
      <div class="smart-report-action-modal__metrics" data-smart-report-action-metrics></div>
      <div class="smart-report-action-modal__steps" data-smart-report-action-steps></div>
      <div class="smart-report-action-modal__status" data-smart-report-action-status>Chưa kích hoạt thao tác.</div>
      <button type="button" class="smart-report-action-modal__primary" data-smart-report-action-confirm>
        <i class="ti ti-send"></i><span data-smart-report-action-primary>Xác nhận</span>
      </button>
    </div>
  </div>`;
}

function reportTimeline() {
  const items = [
    { time: '16:00', id: 'Tổng quan', status: '42.318 cư dân', tone: 'ok' },
    { time: '17:20', id: 'Giao thông', status: 'A4 tải 78%', tone: 'warn' },
    { time: '18:05', id: 'PCCC', status: '2 tòa nguy cơ', tone: 'warn' },
    { time: '19:30', id: 'Dịch vụ', status: 'VinBus 128k', tone: 'ok' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="timeline">
    ${hudHead('Timeline báo cáo')}
    <div class="sc-report-timeline">
      ${items.map((item) => `<button type="button" class="sc-report-timeline__node sc-report-timeline__node--${item.tone}">
        <i></i><strong>${item.time}</strong><span>${item.id}</span><b>${item.status}</b>
      </button>`).join('')}
    </div>
    <button type="button" class="smart-report-history__open" data-smart-report-history-open>
      <i class="ti ti-history"></i><span>Xem lịch sử</span>
    </button>
    ${smartReportHistoryModal()}
  </section>`;
}

const trafficViolationDetails = {
  year: [
    ['2026', '3.842 lỗi', 'Vượt tốc độ, dừng đỗ sai quy định', 'Tăng 6% so với 2025'],
    ['2025', '3.624 lỗi', 'Vượt đèn đỏ, đi sai làn', 'Đã xử lý 94%'],
    ['2024', '3.180 lỗi', 'Không nhường người đi bộ', 'Đã xử lý 91%'],
  ],
  month: [
    ['Tháng 03', '88%', 'Cổng S5A', '146 lỗi vượt tốc độ'],
    ['Tháng 04', '64%', 'Vành đai S6B', '92 lỗi dừng đỗ sai'],
    ['Tháng 05', '76%', 'Nút giao S7C', '118 lỗi vượt đèn đỏ'],
    ['Tháng 06', '96%', 'Trục S8D', '174 lỗi đi sai làn'],
  ],
  week: [
    ['Tuần 23', '42 lỗi', 'Camera AI xác nhận 38 hồ sơ', 'SLA 91%'],
    ['Tuần 24', '56 lỗi', 'Tập trung khung 17:00-19:00', 'SLA 94%'],
    ['Tuần 25', '48 lỗi', '12 lỗi vượt đèn đỏ', 'SLA 89%'],
    ['Tuần 26', '63 lỗi', 'Điểm nóng S8D', 'SLA 96%'],
  ],
  day: [
    ['07:35', 'S5A', 'Vượt tốc độ', 'Đã gửi cảnh báo'],
    ['09:12', 'S6B', 'Dừng đỗ sai quy định', 'Chờ xác minh'],
    ['17:44', 'S7C', 'Vượt đèn đỏ', 'Đã tạo hồ sơ'],
    ['18:20', 'S8D', 'Đi sai làn', 'Đang điều phối'],
  ],
};

function trafficViolationDetailRows(period = 'month') {
  const rows = trafficViolationDetails[period] || trafficViolationDetails.month;
  return rows.map((row) => `<article class="traffic-violation-detail-row">
    <b>${row[0]}</b><strong>${row[1]}</strong><span>${row[2]}</span><em>${row[3]}</em>
  </article>`).join('');
}

function trafficViolationDetailModal() {
  const tabs = [
    ['year', 'Theo năm'],
    ['month', 'Theo tháng'],
    ['week', 'Theo tuần'],
    ['day', 'Theo ngày'],
  ];
  return `<div class="traffic-violation-detail-modal" data-traffic-violation-modal hidden>
    <div class="traffic-violation-detail-modal__panel" role="dialog" aria-modal="true" aria-label="Chi tiết vi phạm giao thông">
      <button type="button" class="traffic-violation-detail-modal__close" data-traffic-violation-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="traffic-violation-detail-modal__head">
        <small>Smart Traffic Analytics</small>
        <h3>Chi tiết vi phạm giao thông</h3>
        <p>Theo dõi tỉ lệ vi phạm theo thời gian, điểm nóng và trạng thái xử lý hồ sơ từ camera AI.</p>
      </header>
      <section class="traffic-violation-detail-modal__kpis">
        <span><b>96%</b><em>Đỉnh tháng 06</em></span>
        <span><b>528</b><em>Hồ sơ 4 tháng</em></span>
        <span><b>94%</b><em>SLA xử lý</em></span>
      </section>
      <nav class="traffic-violation-detail-modal__tabs">
        ${tabs.map(([id, label]) => `<button type="button" class="${id === 'month' ? 'is-active' : ''}" data-traffic-violation-tab="${id}">${label}</button>`).join('')}
      </nav>
      <section class="traffic-violation-detail-modal__list" data-traffic-violation-list>
        ${trafficViolationDetailRows('month')}
      </section>
    </div>
  </div>`;
}

function reportResolution() {
  const points = [
    { label: 'Tháng 03', value: 88, x: 16, y: 24 },
    { label: 'Tháng 04', value: 64, x: 62, y: 39 },
    { label: 'Tháng 05', value: 76, x: 104, y: 32 },
    { label: 'Tháng 06', value: 96, x: 136, y: 17 },
  ];
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${points[0].x},66 ${line} ${points[points.length - 1].x},66`;
  return `<section class="hud-block sc-diagram" data-diagram-family="traffic-violation-rate">
    ${hudHead('Tỉ lệ vi phạm giao thông')}
    <div class="sc-traffic-violation-rate">
      <svg viewBox="0 0 152 78" aria-hidden="true">
        <defs><linearGradient id="trafficViolationRateArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#185fa5" stop-opacity="0.13"/>
        </linearGradient></defs>
        <path class="sc-traffic-violation-rate__grid" d="M16 18H136M16 42H136M16 66H136"/>
        <polygon class="sc-traffic-violation-rate__area" points="${area}"/>
        <polyline class="sc-traffic-violation-rate__line" points="${line}"/>
        ${points.map((point) => `<g class="sc-traffic-violation-rate__point">
          <text class="sc-traffic-violation-rate__pct" x="${point.x}" y="${Math.max(10, point.y - 9)}">${point.value}%</text>
          <circle cx="${point.x}" cy="${point.y}" r="3.6"/>
          <text class="sc-traffic-violation-rate__label" x="${point.x}" y="76">${point.label}</text>
        </g>`).join('')}
      </svg>
    </div>
    <button type="button" class="traffic-violation-detail-open" data-traffic-violation-open>
      <i class="ti ti-list-details"></i><span>Xem chi tiết</span>
    </button>
    ${trafficViolationDetailModal()}
  </section>`;
}

function reportIncidentMatrix() {
  const items = [
    { label: 'Camera AI', value: 94 },
    { label: 'Tuần tra', value: 88 },
    { label: 'Điểm nóng', value: 76 },
    { label: 'Sự cố cư dân', value: 67 },
    { label: 'SLA phản ứng', value: 91 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="incident-matrix">
    ${hudHead('Ma trận cảnh báo an ninh')}
    <div class="sc-incident-matrix">
      ${items.map((item, index) => `<span style="--pct:${item.value}%">
        <em>${item.label}</em><i></i><b>${item.value}%</b>
      </span>`).join('')}
    </div>
  </section>`;
}

function reportOverviewMap() {
  const nodes = [0, 60, 120, 180, 240, 300].map((deg, index) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 50 + Math.cos(rad) * 34, y: 50 + Math.sin(rad) * 34, tone: [1, 4].includes(index) ? 'warn' : 'ok' };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="report-node-map">
    ${hudHead('Tổng quan báo cáo')}
    <div class="sc-report-map sc-report-map--overview">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="sc-report-map__ring" cx="50" cy="50" r="24"/>
        <circle class="sc-report-map__core" cx="50" cy="50" r="8"/>
        ${nodes.map((n) => `<line class="sc-report-map__line" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-report-map__node sc-report-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.5"/>`).join('')}
      </svg>
      <div class="sc-report-overview-kpis">
        <span><b>18:30</b><em>Báo cáo mới</em></span>
        <span><b>24</b><em>Đã tạo</em></span>
        <span><b>7</b><em>Theo dõi</em></span>
        <span><b>3</b><em>Ưu tiên</em></span>
      </div>
    </div>
  </section>`;
}

function smartcityReportSendCard() {
  const steps = [
    ['IOC', 'Dữ liệu ca', 'ti-database'],
    ['16', 'Báo cáo', 'ti-chart-bar'],
    ['Xuất', 'Tổng hợp', 'ti-file-export'],
    ['Cấp trên', 'Chờ gửi', 'ti-send'],
  ];
  return `<section class="hud-block sc-diagram smart-report-submit" data-diagram-family="smart-report-submit">
    ${hudHead('Gửi báo cáo cấp trên')}
    <div class="smart-report-submit__flow" aria-hidden="true">
      ${steps.map(([label, sub, icon]) => `<span><i class="ti ${icon}"></i><b>${label}</b><em>${sub}</em></span>`).join('')}
    </div>
    <div class="smart-report-submit__summary">
      <span><b>16</b><em>Báo cáo</em></span>
      <span><b>13</b><em>Cần theo dõi</em></span>
      <span><b>19%</b><em>Closed-loop</em></span>
    </div>
    <button type="button" class="smart-report-submit__btn" data-smart-report-send-open>
      <i class="ti ti-send"></i><span>Gửi báo cáo</span>
    </button>
    <div class="smart-report-submit__status" data-smart-report-send-status>Chưa gửi báo cáo tổng hợp.</div>
    <div class="smart-report-submit-modal" data-smart-report-send-modal hidden>
      <div class="smart-report-submit-modal__panel" role="dialog" aria-modal="true" aria-label="Gửi báo cáo cấp trên">
        <button type="button" class="smart-report-submit-modal__close" data-smart-report-send-close aria-label="Đóng"><i class="ti ti-x"></i></button>
        <div class="smart-report-submit-modal__head">
          <span><i class="ti ti-file-export"></i></span>
          <div>
            <small>Báo cáo Smart City</small>
            <h3>Gửi báo cáo cấp trên</h3>
          </div>
        </div>
        <div class="smart-report-submit-modal__grid">
          <label><span>Gửi tới</span>
            <select data-smart-report-recipient>
              <option>Ban giám đốc đô thị</option>
              <option>Trung tâm điều hành cấp trên</option>
              <option>Trưởng ban quản lý</option>
              <option>Lãnh đạo vận hành Smart City</option>
            </select>
          </label>
          <label><span>Hình thức gửi</span>
            <select data-smart-report-delivery>
              <option value="system">Gửi trực tiếp từ hệ thống</option>
              <option value="file">Xuất file và gửi</option>
            </select>
          </label>
          <label><span>Định dạng</span>
            <select data-smart-report-format>
              <option>PDF</option>
              <option>Excel (.xlsx)</option>
              <option>PowerPoint (.pptx)</option>
              <option>Link dashboard</option>
            </select>
          </label>
          <label><span>Mức ưu tiên</span>
            <select data-smart-report-priority>
              <option>Bình thường</option>
              <option>Ưu tiên</option>
              <option>Khẩn</option>
            </select>
          </label>
        </div>
        <div class="smart-report-submit-modal__summary">
          <span><b>16</b><em>Báo cáo</em></span>
          <span><b>13</b><em>Cần theo dõi</em></span>
          <span><b>19%</b><em>Closed-loop</em></span>
        </div>
        <button type="button" class="smart-report-submit-modal__primary" data-smart-report-send-confirm>
          <i class="ti ti-send"></i><span>Xác nhận gửi</span>
        </button>
      </div>
    </div>
  </section>`;
}

function smartcityManagementAdviceCard() {
  const notes = [
    ['ti-users-group', '01'],
    ['ti-bolt', '02'],
    ['ti-file-check', '03'],
  ];
  return `<section class="hud-block sc-diagram smart-report-advice" data-diagram-family="smart-report-advice">
    ${hudHead('Gợi ý cho ban quản lý')}
    <div class="smart-report-advice__nodes">
      ${notes.map(([icon, index]) => `<button type="button" class="smart-report-advice__node" title="Gợi ý ${index}">
        <i class="ti ${icon}"></i><b>${index}</b><span></span>
      </button>`).join('')}
    </div>
    <button type="button" class="smart-report-advice__btn" data-smart-report-advice-open>
      <i class="ti ti-send"></i><span>Gửi góp ý</span>
    </button>
    <div class="smart-report-submit__status" data-smart-report-advice-status>Chưa gửi góp ý cho ban quản lý.</div>
    <div class="smart-report-submit-modal smart-report-advice-modal" data-smart-report-advice-modal hidden>
      <div class="smart-report-submit-modal__panel" role="dialog" aria-modal="true" aria-label="Gửi góp ý cho ban quản lý">
        <button type="button" class="smart-report-submit-modal__close" data-smart-report-advice-close aria-label="Đóng"><i class="ti ti-x"></i></button>
        <div class="smart-report-submit-modal__head">
          <span><i class="ti ti-message-report"></i></span>
          <div>
            <small>Gợi ý quản lý Smart City</small>
            <h3>Gửi góp ý cho ban quản lý</h3>
          </div>
        </div>
        <div class="smart-report-submit-modal__grid">
          <label><span>Nhóm góp ý</span>
            <select data-smart-report-advice-topic>
              <option>Quy trình vận hành đô thị</option>
              <option>An ninh và camera AI</option>
              <option>Hạ tầng - tiện ích</option>
              <option>Dịch vụ cư dân</option>
            </select>
          </label>
          <label><span>Mức ưu tiên</span>
            <select data-smart-report-advice-priority>
              <option>Theo dõi</option>
              <option>Ưu tiên</option>
              <option>Cần xử lý ngay</option>
            </select>
          </label>
        </div>
        <label class="smart-report-advice-modal__note"><span>Nội dung</span>
          <textarea data-smart-report-advice-message rows="4">Đề xuất ưu tiên các điểm nóng vận hành Smart City sau ca, tập trung nhóm cảnh báo SLA, hạ tầng và phản ánh cư dân cần theo dõi.</textarea>
        </label>
        <div class="smart-report-submit-modal__summary">
          <span><b>03</b><em>Khuyến nghị</em></span>
          <span><b>01</b><em>Ca vận hành</em></span>
          <span><b>BQL</b><em>Người nhận</em></span>
        </div>
        <button type="button" class="smart-report-submit-modal__primary" data-smart-report-advice-confirm>
          <i class="ti ti-send"></i><span>Xác nhận gửi góp ý</span>
        </button>
      </div>
    </div>
  </section>`;
}

const reportIncidentDetails = {
  all: [
    ['Giao thông', '42 vụ', 'Vượt tốc độ, vượt đèn đỏ, dừng đỗ sai', '14 vụ ưu tiên'],
    ['An ninh', '18 vụ', 'Camera AI, tụ tập bất thường, xâm nhập khu hạn chế', '5 vụ ưu tiên'],
    ['Hạ tầng', '23 vụ', 'Thang máy, cảm biến, chiếu sáng, áp lực nước', '6 vụ ưu tiên'],
    ['Dịch vụ', '31 vụ', 'Phản ánh cư dân, VinBus, tiện ích công cộng', '8 vụ ưu tiên'],
  ],
  traffic: [
    ['Vượt tốc độ', '16 vụ', 'Cổng S5A, trục S8D', 'Đã tạo 12 hồ sơ'],
    ['Vượt đèn đỏ', '11 vụ', 'Nút giao S7C', 'Camera AI xác minh'],
    ['Dừng đỗ sai', '9 vụ', 'Vành đai S6B', 'Đang nhắc xử lý'],
    ['Ùn tắc cục bộ', '6 vụ', 'Khung 17:00-19:00', 'Đã điều tiết luồng'],
  ],
  security: [
    ['Camera AI', '7 vụ', 'Phát hiện tụ tập bất thường', 'Đã xác minh 5 vụ'],
    ['Xâm nhập hạn chế', '4 vụ', 'Khu kỹ thuật và tầng hầm', 'Cần phản ứng nhanh'],
    ['Sự cố cư dân', '5 vụ', 'Yêu cầu hỗ trợ an ninh', 'Đã điều đội tuần tra'],
    ['Camera offline', '2 vụ', 'Mất tín hiệu dưới 10 phút', 'Đội mạng đang xử lý'],
  ],
  infrastructure: [
    ['Thang máy', '6 vụ', 'Lỗi cabin và kẹt tầng', 'Ưu tiên tòa S2'],
    ['Cảm biến', '5 vụ', 'Mất tín hiệu môi trường', 'Đã reset 3 điểm'],
    ['Chiếu sáng', '7 vụ', 'Đèn đường không phản hồi', 'Tạo phiếu bảo trì'],
    ['Nước/điện', '5 vụ', 'Áp lực thấp, nhánh tải cao', 'Đang theo dõi'],
  ],
  service: [
    ['Phản ánh cư dân', '12 vụ', 'Ứng dụng và hotline', 'SLA 91%'],
    ['VinBus', '7 vụ', 'Chậm chuyến, quá tải trạm', 'Đã bổ sung lượt'],
    ['Tiện ích công cộng', '6 vụ', 'Khu sinh hoạt, cảnh quan', 'Đã phân công'],
    ['Phí dịch vụ', '6 vụ', 'Đối soát và nhắc thanh toán', 'Đang xử lý'],
  ],
};

function reportIncidentDetailRows(group = 'all') {
  const rows = reportIncidentDetails[group] || reportIncidentDetails.all;
  return rows.map((row) => `<article class="report-incident-detail-row">
    <b>${row[0]}</b><strong>${row[1]}</strong><span>${row[2]}</span><em>${row[3]}</em>
  </article>`).join('');
}

function reportIncidentDetailModal() {
  const tabs = [
    ['all', 'Tất cả vụ việc'],
    ['traffic', 'Giao thông'],
    ['security', 'An ninh'],
    ['infrastructure', 'Hạ tầng'],
    ['service', 'Dịch vụ'],
  ];
  return `<div class="report-incident-detail-modal" data-report-incident-modal hidden>
    <div class="report-incident-detail-modal__panel" role="dialog" aria-modal="true" aria-label="Chi tiết thống kê vụ việc">
      <button type="button" class="report-incident-detail-modal__close" data-report-incident-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="report-incident-detail-modal__head">
        <small>Smart City Incident Report</small>
        <h3>Chi tiết thống kê vụ việc</h3>
        <p>Tổng hợp các vụ việc phát sinh theo phân hệ để đội vận hành ưu tiên xử lý trong kỳ báo cáo.</p>
      </header>
      <section class="report-incident-detail-modal__kpis">
        <span><b>114</b><em>Tổng vụ việc</em></span>
        <span><b>33</b><em>Ưu tiên</em></span>
        <span><b>92%</b><em>SLA xử lý</em></span>
      </section>
      <nav class="report-incident-detail-modal__tabs">
        ${tabs.map(([id, label]) => `<button type="button" class="${id === 'all' ? 'is-active' : ''}" data-report-incident-tab="${id}">${label}</button>`).join('')}
      </nav>
      <section class="report-incident-detail-modal__list" data-report-incident-list>
        ${reportIncidentDetailRows('all')}
      </section>
    </div>
  </div>`;
}

function reportSensorChart() {
  const bars = [
    { label: 'Giao thông', value: 42 },
    { label: 'An ninh', value: 18 },
    { label: 'Hạ tầng', value: 23 },
    { label: 'Dịch vụ', value: 31 },
  ];
  const maxValue = Math.max(...bars.map((bar) => bar.value));
  return `<section class="hud-block sc-diagram" data-diagram-family="report-bars">
    ${hudHead('Thống kê vụ việc')}
    <div class="sc-report-bars">
      ${bars.map((bar) => `<span><em>${bar.label}</em><i style="height:${Math.max(18, bar.value / maxValue * 100)}%"></i><b>${bar.value}</b></span>`).join('')}
    </div>
    <button type="button" class="report-incident-detail-open" data-report-incident-open>
      <i class="ti ti-list-details"></i><span>Xem chi tiết vụ việc</span>
    </button>
    ${reportIncidentDetailModal()}
  </section>`;
}

function constructionBuildingsPanel() {
  const chartWidth = 250;
  const chartStart = 10;
  const chartEnd = chartWidth - 10;
  const chartSpan = chartEnd - chartStart;
  const points = constructionSites.map((site, index) => {
    const x = chartStart + index * (chartSpan / (constructionSites.length - 1));
    const y = 94 - site.progress * 0.58;
    return {
      ...site,
      x: Number(x.toFixed(1)),
      labelX: Number(Math.min(Math.max(x, chartStart + 8), chartEnd - 8).toFixed(1)),
      y: Number(y.toFixed(1)),
    };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${points[0].x},82 ${polyline} ${points[points.length - 1].x},82`;
  return `<section class="hud-block sc-diagram construction-card" data-diagram-family="construction-buildings">
    ${hudHead('Tòa nhà đang xây dựng')}
    <div class="construction-chart">
      <svg viewBox="0 0 ${chartWidth} 100" aria-hidden="true">
        <path class="construction-chart__grid" d="M${chartStart} 26H${chartEnd}M${chartStart} 44H${chartEnd}M${chartStart} 62H${chartEnd}M${chartStart} 82H${chartEnd}"/>
        <polygon class="construction-chart__area" points="${area}"/>
        <polyline class="construction-chart__line" points="${polyline}"/>
        ${points.map((point) => `<g class="construction-chart__point">
          <text class="construction-chart__pct" x="${point.labelX}" y="${Math.max(point.y - 8, 12)}">${point.progress}%</text>
          <circle cx="${point.x}" cy="${point.y}" r="3.8"/>
          <text class="construction-chart__label" x="${point.labelX}" y="94">${point.id}</text>
        </g>`).join('')}
      </svg>
    </div>
    <div class="construction-sites">
      ${constructionSites.map((site) => `<button type="button" data-construction-open="progress" data-construction-site="${site.id}">
        <b>${site.id}</b><span>${site.status}</span><em>${site.progress}%</em>
      </button>`).join('')}
    </div>
    <div class="construction-actions">
      <button type="button" data-construction-open="progress"><i class="ti ti-chart-line"></i><span>Chi tiết tiến độ</span></button>
      <button type="button" data-construction-open="conflict"><i class="ti ti-barrier-block"></i><span>Xử lý ảnh hưởng</span></button>
    </div>
  </section>`;
}

const infrastructureAlertAxes = [
  { label: 'Nước', value: 88 },
  { label: 'Bụi', value: 76 },
  { label: 'EXIT', value: 92 },
  { label: 'Điện', value: 58 },
  { label: 'Thang', value: 63 },
  { label: 'Cam', value: 46 },
];

const infrastructureAlertItems = [
  { id: 'drain', tag: 'Thoát nước', title: 'B2 có nguy cơ đọng nước sau mưa', level: 'Cao', owner: 'Đội nước', eta: '12 phút', action: 'Mở tuyến bơm phụ và kiểm tra van B2-03.' },
  { id: 'dust', tag: 'Công trình', title: 'Bụi S6B vượt ngưỡng cư dân', level: 'Vừa', owner: 'Giám sát xây dựng', eta: '18 phút', action: 'Yêu cầu tưới giảm bụi và bổ sung lưới chắn.' },
  { id: 'exit', tag: 'Lối EXIT', title: 'EXIT D bị thu hẹp do vật tư', level: 'Cao', owner: 'An toàn hiện trường', eta: '8 phút', action: 'Dọn vật tư khỏi hành lang và mở lại lối thoát.' },
];

function renderInfrastructureAlertModal(mode = 'routes') {
  const isCrew = mode === 'crew';
  const isImpact = mode === 'impact';
  return `<div class="infra-alert-modal" data-infra-alert-modal>
    <div class="infra-alert-modal__panel" role="dialog" aria-modal="true" aria-label="Cảnh báo hạ tầng">
      <button type="button" class="infra-alert-modal__close" data-infra-alert-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="infra-alert-modal__head">
        <small>Điều phối cảnh báo</small>
        <h3>${isCrew ? 'Gửi đội hiện trường' : isImpact ? 'Khu vực bị ảnh hưởng' : 'Tuyến xử lý ưu tiên'}</h3>
        <p>${isCrew ? 'Gán đội phụ trách theo SLA gần nhất để tránh cảnh báo lan sang cư dân.' : isImpact ? 'Xem khu vực có nguy cơ ảnh hưởng vận hành, cư dân và lối thoát.' : 'Ưu tiên các tuyến có điểm rủi ro cao trên radar, xử lý trước B2 và EXIT.'}</p>
      </header>
      <div class="infra-alert-modal__grid">
        ${infrastructureAlertItems.map((item) => `<button type="button" data-infra-alert-item="${item.id}">
          <b>${item.tag}</b><strong>${item.level}</strong><span>${item.title}</span><em>${isCrew ? item.owner : item.eta}</em>
        </button>`).join('')}
      </div>
      <section class="infra-alert-modal__route">
        <h4>${isImpact ? 'Ảnh hưởng cần khoanh vùng' : 'Hành động đề xuất'}</h4>
        ${infrastructureAlertItems.map((item) => `<span><b>${item.tag}</b><em>${item.action}</em></span>`).join('')}
      </section>
      <footer class="infra-alert-modal__foot">
        <span data-infra-alert-status>Chọn một cảnh báo để ghim vào ca xử lý.</span>
        <button type="button" data-infra-alert-apply>${isCrew ? 'Gửi đội phụ trách' : 'Ghim tuyến xử lý'}</button>
      </footer>
    </div>
  </div>`;
}

function showInfrastructureAlertModal(mode) {
  document.querySelector('[data-infra-alert-modal]')?.remove();
  document.body.insertAdjacentHTML('beforeend', renderInfrastructureAlertModal(mode));
}

function infrastructureAlertsPanel() {
  const points = infrastructureAlertAxes.map((axis, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    const radius = axis.value * 0.38;
    return {
      ...axis,
      x: Number((50 + Math.cos(angle) * radius).toFixed(1)),
      y: Number((50 + Math.sin(angle) * radius).toFixed(1)),
      lx: Number((50 + Math.cos(angle) * 45).toFixed(1)),
      ly: Number((50 + Math.sin(angle) * 45).toFixed(1)),
    };
  });
  const shape = points.map((point) => `${point.x},${point.y}`).join(' ');
  const outer = infrastructureAlertAxes.map((_, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return `${(50 + Math.cos(angle) * 39).toFixed(1)},${(50 + Math.sin(angle) * 39).toFixed(1)}`;
  }).join(' ');
  const inner = infrastructureAlertAxes.map((_, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return `${(50 + Math.cos(angle) * 25).toFixed(1)},${(50 + Math.sin(angle) * 25).toFixed(1)}`;
  }).join(' ');
  return `<section class="hud-block sc-diagram infra-alert-card" data-diagram-family="infra-alert-radar">
    ${hudHead('Cảnh báo hạ tầng')}
    <div class="infra-alert-radar">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="infra-alert-radar__ring" points="${outer}"/>
        <polygon class="infra-alert-radar__ring infra-alert-radar__ring--inner" points="${inner}"/>
        ${points.map((point) => `<line class="infra-alert-radar__axis" x1="50" y1="50" x2="${point.lx}" y2="${point.ly}"/>`).join('')}
        <polygon class="infra-alert-radar__shadow" points="${shape}"/>
        <polygon class="infra-alert-radar__shape" points="${shape}"/>
        ${points.map((point) => `<text class="infra-alert-radar__label" x="${point.lx}" y="${point.ly}">${point.label}</text>`).join('')}
      </svg>
    </div>
    <div class="infra-alert-list">
      ${infrastructureAlertItems.map((item) => `<button type="button" data-infra-alert-open="routes" data-infra-alert-item="${item.id}">
        <b>${item.tag}</b><span>${item.title}</span><em>${item.eta}</em>
      </button>`).join('')}
    </div>
    <div class="infra-alert-actions">
      <button type="button" data-infra-alert-open="routes"><i class="ti ti-route"></i><span>Mở tuyến xử lý</span></button>
      <button type="button" data-infra-alert-open="crew"><i class="ti ti-users-group"></i><span>Gửi đội hiện trường</span></button>
      <button type="button" data-infra-alert-open="impact"><i class="ti ti-map-pin"></i><span>Khu ảnh hưởng</span></button>
    </div>
  </section>`;
}

function pipeInfrastructurePanel() {
  const kpis = [
    { label: 'Áp suất', value: '4.2 bar', icon: 'ti-gauge' },
    { label: 'Lưu lượng', value: '92%', icon: 'ti-ripple' },
    { label: 'Điểm rò rỉ', value: '2', icon: 'ti-alert-triangle' },
  ];
  return `<section class="hud-block sc-diagram pipe-infra-card" data-diagram-family="pipe-infra">
    ${hudHead('Hạ tầng đường ống')}
    <div class="pipe-infra__stat">
      <div class="pipe-infra__stat-main"><b>96.4%</b><span>Độ ổn định đường ống</span></div>
      <em class="pipe-infra__trend"><i class="ti ti-trending-up"></i>+1.8%</em>
    </div>
    <div class="pipe-infra__chart"><canvas id="pipeStabilityChart"></canvas></div>
    <div class="pipe-infra__kpis">
      ${kpis.map((kpi) => `<span class="pipe-infra__kpi"><i class="ti ${kpi.icon}"></i><b>${kpi.value}</b><em>${kpi.label}</em></span>`).join('')}
    </div>
    <div class="pipe-reveal" data-pipe-reveal-host>
      <div class="pipe-reveal__head">
        <span><i class="ti ti-stack-2"></i>Hiện đường ống dưới lòng đất</span>
        <b data-pipe-reveal-value>0%</b>
      </div>
      <input type="range" min="0" max="100" value="0" step="1" class="pipe-reveal__slider" data-pipe-reveal aria-label="Độ hiện đường ống">
      <div class="pipe-reveal__hint">Kéo phải để mờ dần thành phố; 100% chỉ còn mạng lưới đường ống.</div>
    </div>
  </section>`;
}

const pageRenderers = {
  environment: {
    left: () => [
      pipeInfrastructurePanel(),
      environmentNetwork(),
      environmentThermalMap(),
      infrastructureHealthSnapshot(),
      environmentLoadMatrix(),
    ].join(''),
    right: () => [
      pcccFireRiskNetwork(),
      environmentRadar(),
      constructionBuildingsPanel(),
      infrastructureAlertsPanel(),
    ].join(''),
  },
  utilities: {
    left: () => [
      utilityResidentHero(),
      utilityNodeMap(),
      utilityServiceMap(),
      utilityFlow(),
    ].join(''),
    right: () => [
      utilityLoadTowers(),
      utilityRulesRadar(),
      utilityVinStandard(),
      utilityServiceAlertsChart(),
    ].join(''),
  },
  reports: {
    left: () => [
      reportSummary(),
      reportTimeline(),
      reportResolution(),
      reportIncidentMatrix(),
    ].join(''),
    right: () => [
      reportOverviewMap(),
      reportSensorChart(),
      smartcityReportSendCard(),
      smartcityManagementAdviceCard(),
    ].join(''),
  },
};

export function renderSmartcityDomainLeft(pageId) {
  return pageRenderers[pageId]?.left() || '';
}

export function renderSmartcityDomainRight(pageId) {
  return pageRenderers[pageId]?.right() || '';
}

export function bindSmartcityReportHistory() {
  if (document.body.dataset.smartcityReportHistoryBound === 'true') return;
  document.body.dataset.smartcityReportHistoryBound = 'true';

  const getItems = (modal) => {
    const panel = modal?.querySelector('[data-smart-report-history-panel]');
    try {
      return JSON.parse(decodeURIComponent(panel?.dataset.smartReportCases || '%5B%5D'));
    } catch {
      return [];
    }
  };

  document.addEventListener('click', (event) => {
    const historyModal = document.querySelector('[data-smart-report-history-modal]');
    const openHistoryModal = document.querySelector('[data-smart-report-history-modal]:not([hidden])');
    const actionModal = document.querySelector('[data-smart-report-action-modal]');
    const openActionModal = document.querySelector('[data-smart-report-action-modal]:not([hidden])');
    const violationModal = document.querySelector('[data-traffic-violation-modal]');
    const openViolationModal = document.querySelector('[data-traffic-violation-modal]:not([hidden])');
    const incidentModal = document.querySelector('[data-report-incident-modal]');
    const openIncidentModal = document.querySelector('[data-report-incident-modal]:not([hidden])');
    const sendModal = document.querySelector('[data-smart-report-send-modal]');
    const openSendModal = document.querySelector('[data-smart-report-send-modal]:not([hidden])');
    const adviceModal = document.querySelector('[data-smart-report-advice-modal]');
    const openAdviceModal = document.querySelector('[data-smart-report-advice-modal]:not([hidden])');

    if (event.target.closest('[data-smart-report-send-open]')) {
      if (sendModal) {
        if (sendModal.parentElement !== document.body) document.body.appendChild(sendModal);
        sendModal.hidden = false;
      }
      return;
    }

    if (openSendModal && (event.target.closest('[data-smart-report-send-close]') || event.target === openSendModal)) {
      openSendModal.hidden = true;
      return;
    }

    if (openSendModal && event.target.closest('[data-smart-report-send-confirm]')) {
      const recipient = openSendModal.querySelector('[data-smart-report-recipient]')?.value || 'cấp trên';
      const delivery = openSendModal.querySelector('[data-smart-report-delivery]')?.value || 'system';
      const format = openSendModal.querySelector('[data-smart-report-format]')?.value || 'PDF';
      const status = document.querySelector('[data-smart-report-send-status]');
      const method = delivery === 'system' ? 'trực tiếp từ hệ thống' : `dưới định dạng ${format}`;
      if (status) status.textContent = `Đã gửi báo cáo tổng hợp tới ${recipient} ${method}.`;
      openSendModal.hidden = true;
      return;
    }

    if (event.target.closest('[data-smart-report-advice-open]')) {
      if (adviceModal) {
        if (adviceModal.parentElement !== document.body) document.body.appendChild(adviceModal);
        adviceModal.hidden = false;
      }
      return;
    }

    if (openAdviceModal && (event.target.closest('[data-smart-report-advice-close]') || event.target === openAdviceModal)) {
      openAdviceModal.hidden = true;
      return;
    }

    if (openAdviceModal && event.target.closest('[data-smart-report-advice-confirm]')) {
      const topic = openAdviceModal.querySelector('[data-smart-report-advice-topic]')?.value || 'góp ý';
      const priority = openAdviceModal.querySelector('[data-smart-report-advice-priority]')?.value || 'theo dõi';
      const status = document.querySelector('[data-smart-report-advice-status]');
      if (status) status.textContent = `Đã gửi góp ý "${topic}" với mức ${priority} tới ban quản lý Smart City.`;
      openAdviceModal.hidden = true;
      return;
    }

    if (event.target.closest('[data-report-incident-open]')) {
      if (incidentModal) {
        if (incidentModal.parentElement !== document.body) document.body.appendChild(incidentModal);
        incidentModal.hidden = false;
      }
      return;
    }

    if (openIncidentModal && (event.target.closest('[data-report-incident-close]') || event.target === openIncidentModal)) {
      openIncidentModal.hidden = true;
      return;
    }

    const incidentTab = event.target.closest('[data-report-incident-tab]');
    if (openIncidentModal && incidentTab) {
      openIncidentModal.querySelectorAll('[data-report-incident-tab]').forEach((button) => {
        button.classList.toggle('is-active', button === incidentTab);
      });
      const list = openIncidentModal.querySelector('[data-report-incident-list]');
      if (list) list.innerHTML = reportIncidentDetailRows(incidentTab.dataset.reportIncidentTab);
      return;
    }

    if (event.target.closest('[data-traffic-violation-open]')) {
      if (violationModal) {
        if (violationModal.parentElement !== document.body) document.body.appendChild(violationModal);
        violationModal.hidden = false;
      }
      return;
    }

    if (openViolationModal && (event.target.closest('[data-traffic-violation-close]') || event.target === openViolationModal)) {
      openViolationModal.hidden = true;
      return;
    }

    const violationTab = event.target.closest('[data-traffic-violation-tab]');
    if (openViolationModal && violationTab) {
      openViolationModal.querySelectorAll('[data-traffic-violation-tab]').forEach((button) => {
        button.classList.toggle('is-active', button === violationTab);
      });
      const list = openViolationModal.querySelector('[data-traffic-violation-list]');
      if (list) list.innerHTML = trafficViolationDetailRows(violationTab.dataset.trafficViolationTab);
      return;
    }

    if (event.target.closest('[data-smart-report-history-open]')) {
      if (historyModal) {
        if (historyModal.parentElement !== document.body) document.body.appendChild(historyModal);
        historyModal.hidden = false;
      }
      return;
    }

    if (openHistoryModal && (event.target.closest('[data-smart-report-history-close]') || event.target === openHistoryModal)) {
      openHistoryModal.hidden = true;
      return;
    }

    const tab = event.target.closest('[data-smart-report-history-tab]');
    if (openHistoryModal && tab) {
      openHistoryModal.querySelectorAll('[data-smart-report-history-tab]').forEach((button) => {
        button.classList.toggle('hud-tab--active', button === tab);
      });
      const panel = openHistoryModal.querySelector('[data-smart-report-history-panel]');
      if (panel) panel.innerHTML = smartReportCaseList(getItems(openHistoryModal), tab.dataset.smartReportHistoryTab);
      return;
    }

    const escalate = event.target.closest('[data-smart-report-escalate]');
    if (openHistoryModal && escalate) {
      const card = openHistoryModal.querySelector(`[data-smart-report-case="${escalate.dataset.smartReportEscalate}"]`);
      const item = getItems(openHistoryModal).find((entry) => entry.id === escalate.dataset.smartReportEscalate);
      const status = card?.querySelector('[data-smart-report-case-status]');
      if (status && item) {
        status.textContent = `Đã đẩy ${item.owner} vào hàng ưu tiên điều phối; dashboard sẽ giữ cảnh báo đến khi có xác nhận SLA.`;
        status.hidden = false;
      }
      escalate.disabled = true;
      escalate.querySelector('span').textContent = 'Đã đẩy điều phối';
      return;
    }

    const resolve = event.target.closest('[data-smart-report-resolve]');
    if (openHistoryModal && actionModal && resolve) {
      const item = getItems(openHistoryModal).find((entry) => entry.id === resolve.dataset.smartReportResolve);
      if (!item) return;
      if (actionModal.parentElement !== document.body) document.body.appendChild(actionModal);
      actionModal.dataset.activeReport = item.id;
      actionModal.querySelector('[data-smart-report-action-tag]').textContent = `${item.id} · ${item.owner}`;
      actionModal.querySelector('[data-smart-report-action-title]').textContent = item.action;
      actionModal.querySelector('[data-smart-report-action-summary]').textContent = item.summary;
      actionModal.querySelector('[data-smart-report-action-primary]').textContent = item.action;
      actionModal.querySelector('[data-smart-report-action-status]').textContent = 'Chưa kích hoạt thao tác.';
      actionModal.querySelector('[data-smart-report-action-route]').innerHTML = item.route
        .map((step, index) => `${index ? '<i></i>' : ''}<span>${step}</span>`)
        .join('');
      actionModal.querySelector('[data-smart-report-action-metrics]').innerHTML = item.metrics
        .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
        .join('');
      actionModal.querySelector('[data-smart-report-action-steps]').innerHTML = item.steps
        .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
        .join('');
      actionModal.hidden = false;
      return;
    }

    if (openActionModal && (event.target.closest('[data-smart-report-action-close]') || event.target === openActionModal)) {
      openActionModal.hidden = true;
      return;
    }

    if (openActionModal && event.target.closest('[data-smart-report-action-confirm]')) {
      const id = openActionModal.dataset.activeReport;
      const card = historyModal?.querySelector(`[data-smart-report-case="${id}"]`);
      const status = card?.querySelector('[data-smart-report-case-status]');
      const resolveButton = card?.querySelector('[data-smart-report-resolve]');
      if (status) {
        status.textContent = 'Đã gửi lệnh tác động lên dashboard Smart City; trạng thái chuyển sang đang giải quyết.';
        status.hidden = false;
      }
      if (resolveButton) {
        resolveButton.disabled = true;
        resolveButton.querySelector('span').textContent = 'Đang giải quyết';
      }
      openActionModal.querySelector('[data-smart-report-action-status]').textContent = 'Đã kích hoạt luồng tác động nội bộ Smart City.';
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelector('[data-report-incident-modal]:not([hidden])')?.setAttribute('hidden', '');
    document.querySelector('[data-traffic-violation-modal]:not([hidden])')?.setAttribute('hidden', '');
    document.querySelector('[data-smart-report-send-modal]:not([hidden])')?.setAttribute('hidden', '');
    document.querySelector('[data-smart-report-advice-modal]:not([hidden])')?.setAttribute('hidden', '');
    document.querySelector('[data-smart-report-action-modal]:not([hidden])')?.setAttribute('hidden', '');
    document.querySelector('[data-smart-report-history-modal]:not([hidden])')?.setAttribute('hidden', '');
  });
}

export function bindVinServiceModal() {
  if (document.body.dataset.vinServiceModalBound === 'true') return;
  document.body.dataset.vinServiceModalBound = 'true';

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-vin-service-open]');
    if (opener) {
      showVinServiceModal(opener.dataset.vinServiceOpen);
      return;
    }

    const modal = event.target.closest('[data-vin-service-modal]');
    if (event.target.closest('[data-vin-service-close]') || event.target === modal) {
      modal?.remove();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelector('[data-vin-service-modal]')?.remove();
  });
}
