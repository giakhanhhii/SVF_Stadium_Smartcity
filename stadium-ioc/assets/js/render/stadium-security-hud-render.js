import { hudHead, areaChartSvg } from './hud-charts.js';
import { distributionChart } from './radial3d-chart.js';
import { securityHud } from '../data/stadium-security-hud-data.js';

const zoneActionConfigs = {
  live: [
    {
      icon: 'ti-door',
      tag: 'TRỰC TIẾP',
      title: 'Mở cổng B2',
      summary: 'Kích hoạt mở cổng B2 có kiểm soát để giảm áp lực tại khán đài B và đẩy dòng người sang làn phụ.',
      route: ['Khán đài B', 'Cổng B2', 'Đội cổng'],
      stats: [['ETA', '2 ph'], ['Nhân sự', '2 tổ'], ['Ưu tiên', 'Cao']],
      steps: ['Mở làn kiểm soát B2', 'Điều phối hàng chờ sang cổng phụ', 'Theo dõi camera mật độ trong 5 phút'],
      status: 'Chờ xác nhận mở cổng B2 và điều đội cổng.',
      done: 'Đã gửi lệnh mở cổng B2, đội cổng và camera B2 đang theo dõi dòng người.',
      primary: 'Mở cổng B2',
    },
    {
      icon: 'ti-shield-up',
      tag: 'TRỰC TIẾP',
      title: 'Tăng tuần tra',
      summary: 'Điều thêm tổ an ninh đến vùng cảnh báo để tách đám đông, giữ lối đi và xử lý sự cố tại chỗ.',
      route: ['VOC', 'Khán đài B', 'Tổ tuần tra'],
      stats: [['Bổ sung', '3 tổ'], ['Thời gian', '3 ph'], ['Kênh', 'VOC-21']],
      steps: ['Gọi tổ nhanh gần cổng B', 'Đặt một tổ tại lối lên xuống', 'Bảo vệ camera theo dõi điểm nóng'],
      status: 'Chờ xác nhận điều tổ tuần tra tăng cường.',
      done: 'Đã điều 3 tổ tuần tra đến khán đài B và mở kênh VOC-21.',
      primary: 'Điều tuần tra',
    },
    {
      icon: 'ti-speakerphone',
      tag: 'TRỰC TIẾP',
      title: 'PA thông báo',
      summary: 'Phát thông báo hướng dẫn khán giả di chuyển chậm, ưu tiên cổng phụ và không dừng lại ở cầu thang.',
      route: ['VOC', 'PA khu B', 'Khán giả'],
      stats: [['Lần phát', '3'], ['Vùng', 'B/C'], ['Lặp lại', '60s']],
      steps: ['Chọn loa PA khu B/C', 'Phát nội dung hướng dẫn thoát dòng', 'Lặp lại sau 60 giây nếu mật độ chưa giảm'],
      status: 'Chờ xác nhận phát PA cho khu B/C.',
      done: 'Đã phát PA khu B/C và lập lịch nhắc lại sau 60 giây.',
      primary: 'Phát PA',
    },
  ],
  forecast: [
    {
      icon: 'ti-users-minus',
      tag: 'DỰ BÁO',
      title: 'Giảm mật độ B',
      summary: 'Kích hoạt kế hoạch giảm mật độ khán đài B trước khi điểm nóng B-12 vượt ngưỡng trong 10 phút tới.',
      route: ['AI dự báo', 'Khán đài B', 'Cổng phụ'],
      stats: [['Dự báo', '10 ph'], ['Mục tiêu', '-18%'], ['Rủi ro', 'Vàng']],
      steps: ['Mở hướng đi sang cổng phụ', 'Giảm tốc dòng vào khu B', 'Theo dõi lại bản đồ nhiệt sau 5 phút'],
      status: 'Chờ xác nhận kích hoạt giảm mật độ khu B.',
      done: 'Đã kích hoạt kế hoạch giảm mật độ khu B và cập nhật theo dõi AI.',
      primary: 'Giảm mật độ',
    },
    {
      icon: 'ti-route',
      tag: 'DỰ BÁO',
      title: 'Điều tiết C1',
      summary: 'Chuyển một phần dòng người qua lối C1 để cân bằng áp lực giữa các cổng và tránh tạo điểm chen cục bộ.',
      route: ['B-12', 'Lối C1', 'Cổng C'],
      stats: [['Hướng chuyển', 'C1'], ['Nhân sự', '2 tổ'], ['LED', 'Cập nhật']],
      steps: ['Cập nhật biển LED hướng C1', 'Đặt tổ điều tiết tại điểm giao', 'Giữ lối ưu tiên cho y tế và an ninh'],
      status: 'Chờ xác nhận điều tiết dòng người qua C1.',
      done: 'Đã điều tiết dòng người qua C1 và cập nhật LED chỉ hướng.',
      primary: 'Điều tiết C1',
    },
    {
      icon: 'ti-map-search',
      tag: 'DỰ BÁO',
      title: 'Theo dõi bản đồ nhiệt',
      summary: 'Mở chế độ theo dõi riêng các điểm nhiệt B-12, C1 và hành lang phụ để cảnh báo sớm cho VOC.',
      route: ['Camera AI', 'Heatmap', 'VOC'],
      stats: [['Điểm theo dõi', '3'], ['Ngưỡng', '85%'], ['Chu kỳ', '30s']],
      steps: ['Ghim các điểm B-12 và C1', 'Đặt ngưỡng cảnh báo 85%', 'Gửi cảnh báo nếu xu hướng tăng tiếp'],
      status: 'Chờ xác nhận bật theo dõi bản đồ nhiệt.',
      done: 'Đã bật theo dõi bản đồ nhiệt cho B-12, C1 và hành lang phụ.',
      primary: 'Theo dõi heatmap',
    },
  ],
  history: [
    {
      icon: 'ti-history',
      tag: 'LỊCH SỬ',
      title: 'Xem ca trước',
      summary: 'Mở biên bản ca trước để đội an ninh so sánh cách xử lý các điểm lặp lại quanh khán đài B.',
      route: ['Lịch sử', 'Ca trước', 'VOC'],
      stats: [['Bản ghi', '6'], ['Sự cố lặp', '3'], ['Thời gian', '24h']],
      steps: ['Tải log ca trước', 'Lọc các điểm lặp lại', 'Ghim khuyến nghị xử lý lên VOC'],
      status: 'Chờ xác nhận mở dữ liệu ca trước.',
      done: 'Đã mở dữ liệu ca trước và ghim 3 điểm lặp lại lên VOC.',
      primary: 'Mở ca trước',
    },
    {
      icon: 'ti-map-2',
      tag: 'LỊCH SỬ',
      title: 'So sánh bản đồ nhiệt',
      summary: 'Đối chiếu bản đồ nhiệt hiện tại với các trận gần nhất để tìm mẫu lặp lại và đề xuất điều tiết sớm.',
      route: ['Heatmap cũ', 'Heatmap hiện tại', 'Đề xuất'],
      stats: [['Mẫu lặp', '4'], ['Độ lệch', '12%'], ['Tin cậy', '86%']],
      steps: ['Nạp 4 mẫu heatmap gần nhất', 'So sánh điểm nóng theo khu', 'Xuất đề xuất điều tiết sớm'],
      status: 'Chờ xác nhận so sánh bản đồ nhiệt.',
      done: 'Đã so sánh heatmap và tạo đề xuất điều tiết sớm cho khu B/C.',
      primary: 'So sánh heatmap',
    },
    {
      icon: 'ti-file-export',
      tag: 'LỊCH SỬ',
      title: 'Xuất biên bản',
      summary: 'Tạo biên bản nhanh về vùng cảnh báo, thao tác đã thực hiện và khuyến nghị cho ca trực tiếp theo.',
      route: ['VOC', 'Biên bản', 'Ca sau'],
      stats: [['Mục', '7'], ['Đính kèm', 'Camera'], ['Định dạng', 'PDF']],
      steps: ['Tổng hợp cảnh báo và thao tác', 'Đính kèm ảnh camera/heatmap', 'Gửi cho trưởng ca và ca sau'],
      status: 'Chờ xác nhận xuất biên bản vùng cảnh báo.',
      done: 'Đã xuất biên bản vùng cảnh báo và gửi cho trưởng ca.',
      primary: 'Xuất biên bản',
    },
  ],
};

const patrolActionConfigs = [
  {
    icon: 'ti-shield-up',
    tag: 'TUẦN TRA CHU VI',
    title: 'Tăng tuần tra B',
    summary: 'Điều thêm tổ an ninh về khu B để quét hàng rào, giữ cổng phụ và xử lý điểm nóng quanh vành đai P4.',
    route: ['VOC', 'Khu B', 'Hàng rào P4'],
    stats: [['Bổ sung', '3 tổ'], ['Tuyến', 'Khu B'], ['LED', 'Giữ']],
    steps: ['Gọi tổ nhanh gần cổng B', 'Chia lại điểm quét hàng rào', 'Theo dõi camera P4 trong 5 phút'],
    status: 'Chờ xác nhận điều thêm tổ tuần tra khu B.',
    done: 'Đã tăng 3 tổ tuần tra tại khu B, ưu tiên quét hàng rào và cổng phụ.',
    primary: 'Điều tuần tra',
    quantity: 15,
  },
  {
    icon: 'ti-road',
    tag: 'ĐIỀU TIẾT NGOẠI VI',
    title: 'Mở làn P3',
    summary: 'Mở làn phụ P3 để giảm áp lực P4, đồng thời chuyển một tổ tuần tra sang điểm giao cắt xe vào.',
    route: ['P4', 'Làn P3', 'Đội điều tiết'],
    stats: [['Làn mở', '2'], ['Tuyến', 'P3'], ['Nhân sự', '1 tổ']],
    steps: ['Mở làn P3', 'Đặt tổ điều tiết tại điểm nhập làn', 'Theo dõi hàng chờ P4 sau 3 phút'],
    status: 'Chờ xác nhận mở làn P3 và điều tổ tuần tra.',
    done: 'Đã mở làn P3 và chuyển một tổ tuần tra sang điều tiết xe vào.',
    primary: 'Mở làn P3',
    quantity: 13,
  },
  {
    icon: 'ti-device-tv',
    tag: 'BẢNG LED',
    title: 'Cập nhật LED',
    summary: 'Cập nhật bảng LED quanh sân để hướng dẫn xe về P3/P4 và giữ đội tuần tra hiện tại bảo vệ chu vi.',
    route: ['VOC', 'LED cổng Bắc', 'P4'],
    stats: [['Bảng LED', '6/6'], ['Nội dung', 'P3/P4'], ['Tuyến', 'P4']],
    steps: ['Đẩy nội dung LED mới', 'Xác nhận hiển thị cổng Bắc', 'Giữ đội tuần tra hiện tại quanh P4'],
    status: 'Chờ xác nhận cập nhật bảng LED hướng dẫn.',
    done: 'Đã cập nhật LED hướng dẫn, giữ đội tuần tra hiện tại quanh P4.',
    primary: 'Cập nhật LED',
    quantity: 12,
  },
];

function aquaBarChart(bars) {
  const max = Math.max(...bars.map((b) => b.value));
  const cols = bars.map((b, i) => {
    const h = (b.value / max) * 38;
    const opacity = 0.42 + i * 0.08;
    return `<rect x="${4 + i * 18}" y="${42 - h}" width="12" height="${h}" fill="#00d4ff" opacity="${Math.min(opacity, 0.95)}" rx="2"/>`;
  }).join('');
  const labels = bars.map((b, i) =>
    `<text x="${10 + i * 18}" y="50" fill="#7ab0d0" font-size="5" text-anchor="middle">${b.time}</text>`,
  ).join('');
  return `<svg viewBox="0 0 112 54" class="hud-chart stad-sec-line-chart">${cols}${labels}</svg>`;
}

function aquaDonut(pct, label) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 56 56" class="stad-sec-donut">
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(0,212,255,0.14)" stroke-width="7"/>
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="#00d4ff" stroke-width="7"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 28 28)"/>
    <text x="28" y="26" text-anchor="middle" fill="#7ab0d0" font-size="5">${label}</text>
    <text x="28" y="36" text-anchor="middle" fill="#00d4ff" font-size="10" font-weight="700">${pct}%</text>
  </svg>`;
}

function modeInsight(view) {
  if (!view.statTitle.includes('Chu vi')) return '';
  return `<div class="security-mode-insight">
    <div class="security-mode-ring">
      <strong>100%</strong>
      <span>Phủ cảm biến</span>
    </div>
    <div class="security-mode-metrics">
      <span><b>8</b><em>Điểm gác</em></span>
      <span><b>0</b><em>Mất tín hiệu</em></span>
      <span><b>4 ph</b><em>Tuần tra</em></span>
    </div>
  </div>
  <div class="security-mode-rail"><span style="width: 100%"></span></div>`;
}

function trafficModeDetail(view) {
  if (!view.routes?.length) return '';
  const routes = view.routes.map((route) => `
    <div class="security-traffic-route security-traffic-route--${route.tone}">
      <div class="security-traffic-route__head">
        <span>${route.label}</span><strong>${route.value}</strong>
      </div>
      <div class="security-traffic-route__track"><i style="width:${route.pct}%"></i></div>
    </div>
  `).join('');
  const hotspots = (view.hotspots || []).map((spot) => `
    <span class="security-traffic-hotspot">
      <b>${spot.zone}</b><strong>${spot.wait}</strong><em>${spot.note}</em>
    </span>
  `).join('');
  const actions = (view.actions || []).map((action) =>
    `<button type="button" class="hud-vent-btn">${action}</button>`,
  ).join('');
  return `<div class="security-traffic-panel">
    <div class="security-traffic-summary">${view.summary}</div>
    <div class="security-traffic-map" aria-hidden="true">
      <svg viewBox="0 0 160 76">
        <path class="security-traffic-map__road" d="M8 18h100l24 18-24 18H8"/>
        <path class="security-traffic-map__road security-traffic-map__road--alt" d="M38 68V44h84"/>
        <circle class="security-traffic-map__node security-traffic-map__node--ok" cx="28" cy="18" r="5"/>
        <circle class="security-traffic-map__node security-traffic-map__node--warn" cx="92" cy="18" r="6"/>
        <circle class="security-traffic-map__node security-traffic-map__node--hot" cx="124" cy="36" r="7"/>
        <circle class="security-traffic-map__node security-traffic-map__node--ok" cx="38" cy="68" r="5"/>
      </svg>
      <div class="security-traffic-hotspots">${hotspots}</div>
    </div>
    <div class="security-traffic-routes">${routes}</div>
    <div class="hud-vent-row security-traffic-actions">${actions}</div>
  </div>`;
}

function renderModeView(view) {
  return `
    <section class="hud-block">${hudHead(view.statTitle)}
      <div class="stad-sec-gauge">
        <i class="ti ${view.icon}"></i>
        <strong>${view.value}</strong>
        <span>${view.label}</span>
      </div>
      ${modeInsight(view)}
      ${trafficModeDetail(view)}
    </section>
    <section class="hud-block">${hudHead(view.chartTitle)}${aquaBarChart(view.bars)}</section>`;
}

function renderMetricBars(metrics) {
  return `<div class="stad-sec-bars">${metrics.map((m) =>
    `<div class="stad-sec-bar" title="${m.label}: ${m.value}">
      <span style="width:${m.pct}%"></span><strong>${m.value}</strong>
    </div>`,
  ).join('')}</div>`;
}

function renderAccessView(block, key) {
  const values = ['main', 'secondary'];
  const view = block.views[key] || block.views.main;
  const tabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab hud-tab--sm${value === key ? ' hud-tab--active' : ''}" data-security-access="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs" data-security-access-tabs>${tabs}</div>
    <div class="hud-env-row">${aquaDonut(view.ringPct, view.ringLabel)}${renderMetricBars(view.metrics)}</div>`;
}

function renderZonesView(block, key) {
  const values = ['live', 'forecast', 'history'];
  const view = block.views[key] || block.views.live;
  const zTabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab hud-tab--sm${value === key ? ' hud-tab--active' : ''}" data-security-zone="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs hud-tabs--wrap" data-security-zone-tabs>${zTabs}</div>
    ${zoneMatrix(view.quantity, view.status)}
    <div class="hud-vent-row">${view.lanes.map((v, index) => `<button class="hud-vent-btn" data-security-zone-action="${index}" data-security-zone-key="${key}">${v}</button>`).join('')}</div>`;
}

function securityZoneActionModal() {
  return `<div class="event-action-modal security-zone-modal" data-security-zone-modal hidden>
    <div class="event-action-modal__panel security-zone-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối vùng cảnh báo">
      <button type="button" class="event-action-modal__close" data-security-zone-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-shield-check" data-security-zone-icon></i></span>
        <div><small data-security-zone-tag>VÙNG CẢNH BÁO</small><h3 data-security-zone-title>Điều phối an ninh</h3></div>
      </div>
      <p data-security-zone-summary></p>
      <div class="fac-action-modal__route" data-security-zone-route></div>
      <div class="fac-action-modal__stats" data-security-zone-stats></div>
      <div class="event-action-modal__steps" data-security-zone-steps></div>
      <div class="event-action-modal__status"><i class="ti ti-broadcast"></i><span data-security-zone-status>Chờ xác nhận thao tác vùng cảnh báo.</span></div>
      <button type="button" class="event-action-modal__primary" data-security-zone-confirm>
        <i class="ti ti-send"></i><span data-security-zone-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

function getSecurityZoneModal(root) {
  const modal = root.querySelector('[data-security-zone-modal]') || document.querySelector('[data-security-zone-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-security-zone-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function openSecurityZoneModal(root, action) {
  const modal = getSecurityZoneModal(root);
  if (!modal || !action) return;
  modal.querySelector('[data-security-zone-icon]').className = `ti ${action.icon}`;
  modal.querySelector('[data-security-zone-tag]').textContent = action.tag;
  modal.querySelector('[data-security-zone-title]').textContent = action.title;
  modal.querySelector('[data-security-zone-summary]').textContent = action.summary;
  modal.querySelector('[data-security-zone-status]').textContent = action.status;
  modal.querySelector('[data-security-zone-primary]').textContent = action.primary;
  modal.querySelector('[data-security-zone-confirm]').hidden = false;
  modal.querySelector('[data-security-zone-route]').innerHTML = action.route
    .map((item, index) => `${index ? '<i></i>' : ''}<span>${item}</span>`)
    .join('');
  modal.querySelector('[data-security-zone-stats]').innerHTML = action.stats
    .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
    .join('');
  modal.querySelector('[data-security-zone-steps]').innerHTML = action.steps
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.dataset.doneStatus = action.done;
  modal.hidden = false;
}

function renderParkingView(block, key) {
  const values = ['parking', 'bus', 'taxi'];
  const view = block.views[key] || block.views.parking;
  const tabs = block.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-security-parking="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(block.title)}<div class="hud-tabs" data-security-parking-tabs>${tabs}</div>
    <div class="hud-env-row">${aquaDonut(view.ringPct, view.ringLabel)}${renderMetricBars(view.metrics)}</div>`;
}

function cameraChart(feeds) {
  return `<div class="stad-sec-camera-grid">${feeds.map((f, i) =>
    `<button class="stad-sec-camera" title="${f.label}" aria-label="${f.label}">
      <svg viewBox="0 0 80 44">
        <rect width="80" height="44" rx="3" fill="#101d2b"/>
        <path d="M8 32h64M16 25h48M24 18h32" stroke="#1a7ea8" stroke-width="1"/>
        <circle cx="${18 + (i % 3) * 21}" cy="${15 + Math.floor(i / 3) * 10}" r="4" fill="#00d4ff" opacity="${0.55 + i * 0.06}"/>
      </svg>
      <span></span>
    </button>`,
  ).join('')}</div>`;
}

function alertChart(alerts) {
  return `<div class="stad-sec-alert-chart">${alerts.map((a, i) =>
    `<div class="stad-sec-alert-bar" title="${a.tag}: ${a.title}">
      <span style="height:${78 - i * 18}%;opacity:${0.95 - i * 0.16}"></span>
      <i>${a.label ?? a.tag}</i>
    </div>`,
  ).join('')}</div>`;
}

function zoneMatrix(quantity, status) {
  const cells = Array.from({ length: 24 }, (_, i) => {
    const tone = i < 4 ? 'hot' : i < 11 ? 'warn' : i < 20 ? 'ok' : 'idle';
    return `<span class="stad-sec-cell stad-sec-cell--${tone}"></span>`;
  }).join('');
  return `<div class="stad-sec-zone-chart" title="${status}">
    <div class="stad-sec-zone-total"><i class="ti ti-camera"></i><strong>${quantity}</strong></div>
    <div class="stad-sec-matrix">${cells}</div>
  </div>`;
}

function patrolChart(d) {
  const cells = Array.from({ length: 18 }, (_, i) => {
    const tone = i < d.quantity ? 'ok' : 'idle';
    return `<span class="stad-sec-cell stad-sec-cell--${tone}"></span>`;
  }).join('');
  return `<div class="stad-sec-zone-chart security-patrol-chart" title="${d.status}" data-security-patrol-chart>
    <div class="stad-sec-zone-total"><i class="ti ti-walk"></i><strong data-security-patrol-quantity>${d.quantity}</strong></div>
    <div class="stad-sec-matrix stad-sec-matrix--patrol">${cells}</div>
  </div>
  <div class="security-patrol-status" data-security-patrol-status>Đội tuần tra đang giữ nhịp kiểm soát quanh ${d.status}.</div>`;
}

function securityPatrolActionModal() {
  return `<div class="event-action-modal security-patrol-modal" data-security-patrol-modal hidden>
    <div class="event-action-modal__panel security-zone-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối tuần tra chu vi">
      <button type="button" class="event-action-modal__close" data-security-patrol-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-shield-check" data-security-patrol-icon></i></span>
        <div><small data-security-patrol-tag>TUẦN TRA CHU VI</small><h3 data-security-patrol-title>Điều phối tuần tra</h3></div>
      </div>
      <p data-security-patrol-summary></p>
      <div class="fac-action-modal__route" data-security-patrol-route></div>
      <div class="fac-action-modal__stats" data-security-patrol-stats></div>
      <div class="event-action-modal__steps" data-security-patrol-steps></div>
      <div class="event-action-modal__status"><i class="ti ti-broadcast"></i><span data-security-patrol-modal-status>Chờ xác nhận thao tác tuần tra chu vi.</span></div>
      <button type="button" class="event-action-modal__primary" data-security-patrol-confirm>
        <i class="ti ti-send"></i><span data-security-patrol-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

function getSecurityPatrolModal(root) {
  const modal = root.querySelector('[data-security-patrol-modal]') || document.querySelector('[data-security-patrol-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-security-patrol-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function openSecurityPatrolModal(root, action, actionIndex) {
  const modal = getSecurityPatrolModal(root);
  if (!modal || !action) return;
  modal.querySelector('[data-security-patrol-icon]').className = `ti ${action.icon}`;
  modal.querySelector('[data-security-patrol-tag]').textContent = action.tag;
  modal.querySelector('[data-security-patrol-title]').textContent = action.title;
  modal.querySelector('[data-security-patrol-summary]').textContent = action.summary;
  modal.querySelector('[data-security-patrol-modal-status]').textContent = action.status;
  modal.querySelector('[data-security-patrol-primary]').textContent = action.primary;
  modal.querySelector('[data-security-patrol-confirm]').hidden = false;
  modal.querySelector('[data-security-patrol-route]').innerHTML = action.route
    .map((item, index) => `${index ? '<i></i>' : ''}<span>${item}</span>`)
    .join('');
  modal.querySelector('[data-security-patrol-stats]').innerHTML = action.stats
    .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
    .join('');
  modal.querySelector('[data-security-patrol-steps]').innerHTML = action.steps
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.dataset.actionIndex = String(actionIndex);
  modal.hidden = false;
}

function applySecurityPatrolAction(actionIndex) {
  const activePage = document.querySelector('#page-security.active') || document.getElementById('page-security');
  const card = activePage?.querySelector('.hud-block--security-patrol');
  const action = patrolActionConfigs[actionIndex] || patrolActionConfigs[0];
  const quantityEl = card?.querySelector('[data-security-patrol-quantity]');
  const statusEl = card?.querySelector('[data-security-patrol-status]');
  const cells = [...(card?.querySelectorAll('.stad-sec-matrix--patrol .stad-sec-cell') || [])];
  if (quantityEl) quantityEl.textContent = String(action.quantity);
  if (statusEl) statusEl.textContent = action.done;
  cells.forEach((cell, index) => {
    cell.classList.toggle('stad-sec-cell--ok', index < action.quantity);
    cell.classList.toggle('stad-sec-cell--idle', index >= action.quantity);
  });
  card?.querySelectorAll('[data-security-patrol-action]').forEach((el) => {
    el.classList.toggle('hud-vent-btn--active', Number(el.dataset.securityPatrolAction || 0) === actionIndex);
  });
  return action.done;
}

function statTiles(stats) {
  return `<div class="hud-energy-grid">${stats.map((s) =>
    `<div class="hud-energy-cell" title="${s.label}: ${s.value}">
      <div class="hud-energy-val">${s.value}</div>
      <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div>
    </div>`,
  ).join('')}</div>`;
}

function traffic24hPanel(traffic) {
  const kpis = [
    { label: 'Xe/h', value: '420', tone: 'warn' },
    { label: 'Ùn', value: '2', tone: 'hot' },
    { label: 'Shuttle', value: '18/20', tone: 'ok' },
    { label: 'Ra TB', value: '18 ph', tone: 'ok' },
  ];
  const routes = [
    { label: 'Cổng B', value: '46 xe/ph', pct: 78, tone: 'warn' },
    { label: 'Bãi P4', value: '58 xe/ph', pct: 92, tone: 'hot' },
    { label: 'P3 dự phòng', value: '21 xe/ph', pct: 34, tone: 'ok' },
  ];
  const labels = ['16h', '18h', '20h', '22h'];
  return `<div class="traffic24-panel">
    <div class="traffic24-status">
      <i class="ti ti-traffic-lights"></i>
      <span>P4 / Cổng B tải cao</span>
    </div>
    <div class="traffic24-kpis">
      ${kpis.map((item) => `<span class="traffic24-kpi traffic24-kpi--${item.tone}">
        <b>${item.value}</b><em>${item.label}</em>
      </span>`).join('')}
    </div>
    <div class="traffic24-routes">
      ${routes.map((route) => `<span class="traffic24-route traffic24-route--${route.tone}">
        <b>${route.label}</b><i><em style="width:${route.pct}%"></em></i><strong>${route.value}</strong>
      </span>`).join('')}
    </div>
    <div class="traffic24-actions">
      <span>Lệnh</span><b>P3</b><b>Bus</b><b>LED</b>
    </div>
    <div class="traffic24-chart">
      ${areaChartSvg(traffic.chart, 'secExtGrad')}
      <div class="traffic24-chart__axis">${labels.map((label) => `<span>${label}</span>`).join('')}</div>
    </div>
  </div>`;
}

function fifaSafetyMatrix() {
  const axes = [
    { label: 'VOC', value: 96 },
    { label: 'CAM', value: 92 },
    { label: 'CỔNG', value: 88 },
    { label: 'VÀNH', value: 90 },
    { label: 'TUẦN', value: 84 },
    { label: 'Y TẾ', value: 76 },
  ];
  const cells = Array.from({ length: 24 }, (_, i) => {
    const tone = [5, 17].includes(i) ? 'warn' : [2, 8, 13].includes(i) ? 'hot' : 'ok';
    return `<span class="fifa-sec-cell fifa-sec-cell--${tone}"></span>`;
  }).join('');
  const points = axes.map((item, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const radius = 38 * (item.value / 100);
    return `${(50 + Math.cos(angle) * radius).toFixed(1)},${(50 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' ');
  return `<div class="fifa-sec-readiness">
    <svg class="fifa-sec-radar" viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="fifa-sec-radar__grid" points="50,12 82.9,31 82.9,69 50,88 17.1,69 17.1,31"/>
      <polygon class="fifa-sec-radar__grid fifa-sec-radar__grid--inner" points="50,27 69.9,38.5 69.9,61.5 50,73 30.1,61.5 30.1,38.5"/>
      ${axes.map((item, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const x = 50 + Math.cos(angle) * 46;
    const y = 50 + Math.sin(angle) * 46;
    return `<line x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${item.label}</text>`;
  }).join('')}
      <polygon class="fifa-sec-radar__shape" points="${points}"/>
    </svg>
    <div class="fifa-sec-bars">${axes.map((item) => `
      <span><b>${item.label}</b><i><em style="width:${item.value}%"></em></i><strong>${item.value}%</strong></span>
    `).join('')}</div>
    <div class="fifa-sec-matrix">${cells}</div>
  </div>`;
}

export function renderSecurityLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.crowd.title)}
      ${distributionChart(d.crowd.total, d.crowd.groups, { idSuffix: 'Crowd', totalLabel: d.crowd.totalLabel, fillPercent: d.crowd.fillPercent })}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}${cameraChart(d.cameras.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual" data-security-mode-tabs>
      <button class="hud-tab hud-tab--active" data-security-mode="live">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-security-mode="ai">${d.modeTabs[1]}</button>
    </div>
    <div data-security-mode-panel>${renderModeView(d.modeViews.live)}</div>`;
}

export function renderSecurityRight(d) {
  return `
    <section class="hud-block">${hudHead('Cảnh báo')}${alertChart(d.alerts)}</section>
    <section class="hud-block hud-block--fifa-sec">${hudHead('Sẵn sàng an ninh')}${fifaSafetyMatrix()}</section>
    <section class="hud-block hud-block--security-access" data-security-access-panel>${renderAccessView(d.access, 'main')}</section>
    <section class="hud-block hud-block--security-zones" data-security-zone-panel>${renderZonesView(d.zones, 'live')}</section>
    ${securityZoneActionModal()}`;
}

export function renderSecurityExteriorLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.ingress.title)}
      ${distributionChart(d.ingress.total, d.ingress.groups, { idSuffix: 'Ingress', totalLabel: d.ingress.totalLabel })}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}${cameraChart(d.cameras.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual" data-security-exterior-mode-tabs>
      <button class="hud-tab hud-tab--active" data-security-exterior-mode="perimeter">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-security-exterior-mode="traffic">${d.modeTabs[1]}</button>
    </div>
    <div data-security-exterior-mode-panel>${renderModeView(d.modeViews.perimeter)}</div>`;
}

export function renderSecurityExteriorRight(d) {
  return `
    <section class="hud-block">${hudHead('Cảnh báo ngoại vi')}${alertChart(d.alerts)}</section>
    <section class="hud-block" data-security-parking-panel>${renderParkingView(d.parking, 'parking')}</section>
    <section class="hud-block hud-block--security-patrol">${hudHead(d.patrol.title)}
      ${patrolChart(d.patrol)}
      <div class="hud-vent-row">${d.patrol.lanes.map((v, index) => `<button class="hud-vent-btn" data-security-patrol-action="${index}">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow hud-block--traffic-24h">${hudHead(d.traffic.title)}
      ${traffic24hPanel(d.traffic)}
    </section>
    ${securityPatrolActionModal()}`;
}

export function bindSecurityHudTabs(root, data) {
  root.querySelector('[data-security-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-mode]');
    const panel = root.querySelector('[data-security-mode-panel]');
    const view = data.left.modeViews[tab?.dataset.securityMode];
    if (panel && view) panel.innerHTML = renderModeView(view);
  });

  root.querySelector('[data-security-access-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-access]');
    const panel = root.querySelector('[data-security-access-panel]');
    if (tab && panel) panel.innerHTML = renderAccessView(data.right.access, tab.dataset.securityAccess);
  });

  root.querySelector('[data-security-zone-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-zone]');
    const panel = root.querySelector('[data-security-zone-panel]');
    if (tab && panel) {
      panel.innerHTML = renderZonesView(data.right.zones, tab.dataset.securityZone);
      return;
    }
    const actionButton = event.target.closest('[data-security-zone-action]');
    if (!actionButton || !panel?.contains(actionButton)) return;
    const key = actionButton.dataset.securityZoneKey || 'live';
    const actionIndex = Number(actionButton.dataset.securityZoneAction || 0);
    const action = zoneActionConfigs[key]?.[actionIndex];
    openSecurityZoneModal(root, action);
  });
}

export function bindSecurityExteriorHudTabs(root, data) {
  root.querySelector('[data-security-exterior-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-exterior-mode]');
    const panel = root.querySelector('[data-security-exterior-mode-panel]');
    const view = data.left.modeViews[tab?.dataset.securityExteriorMode];
    if (panel && view) panel.innerHTML = renderModeView(view);
  });

  root.querySelector('[data-security-parking-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-security-parking]');
    const panel = root.querySelector('[data-security-parking-panel]');
    if (tab && panel) panel.innerHTML = renderParkingView(data.right.parking, tab.dataset.securityParking);
  });

  root.querySelectorAll('[data-security-patrol-action]').forEach((button) => {
    if (button.dataset.securityPatrolBound === 'true') return;
    button.dataset.securityPatrolBound = 'true';
    button.addEventListener('click', () => {
      const actionIndex = Number(button.dataset.securityPatrolAction || 0);
      openSecurityPatrolModal(root, patrolActionConfigs[actionIndex], actionIndex);
    });
  });
}

function handleSecurityZoneDelegation(event) {
  const zoneTab = event.target.closest('#page-security.active [data-security-zone-panel] [data-security-zone]');
  if (zoneTab) {
    const panel = document.querySelector('#page-security.active [data-security-zone-panel]');
    if (panel) panel.innerHTML = renderZonesView(securityHud.right.zones, zoneTab.dataset.securityZone);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const zoneAction = event.target.closest('#page-security.active [data-security-zone-panel] [data-security-zone-action]');
  if (zoneAction) {
    const root = document.getElementById('page-security');
    const key = zoneAction.dataset.securityZoneKey || 'live';
    const actionIndex = Number(zoneAction.dataset.securityZoneAction || 0);
    openSecurityZoneModal(root, zoneActionConfigs[key]?.[actionIndex]);
    event.preventDefault();
    event.stopPropagation();
    return;
  }
}

document.addEventListener('click', handleSecurityZoneDelegation, true);

document.addEventListener('click', (event) => {
  const activePatrolModal = document.querySelector('[data-security-patrol-modal]:not([hidden])');
  if (activePatrolModal) {
    if (event.target.closest('[data-security-patrol-close]') || event.target === activePatrolModal) {
      activePatrolModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-security-patrol-confirm]')) {
      const actionIndex = Number(activePatrolModal.dataset.actionIndex || 0);
      activePatrolModal.querySelector('[data-security-patrol-modal-status]').textContent = applySecurityPatrolAction(actionIndex);
      activePatrolModal.querySelector('[data-security-patrol-confirm]').hidden = true;
      return;
    }
  }

  const activeModal = document.querySelector('[data-security-zone-modal]:not([hidden])');
  if (!activeModal) return;
  if (event.target.closest('[data-security-zone-close]') || event.target === activeModal) {
    activeModal.hidden = true;
    return;
  }
  if (event.target.closest('[data-security-zone-confirm]')) {
    activeModal.querySelector('[data-security-zone-status]').textContent = activeModal.dataset.doneStatus || 'Đã xác nhận thao tác vùng cảnh báo.';
    activeModal.querySelector('[data-security-zone-confirm]').hidden = true;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const activePatrolModal = document.querySelector('[data-security-patrol-modal]:not([hidden])');
  if (activePatrolModal) activePatrolModal.hidden = true;
  const activeModal = document.querySelector('[data-security-zone-modal]:not([hidden])');
  if (activeModal) activeModal.hidden = true;
});
