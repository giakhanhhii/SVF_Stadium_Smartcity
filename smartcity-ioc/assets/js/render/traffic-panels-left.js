import { renderTrafficViolations, redLightModal } from './traffic-violations.js';
import { openTrafficLiveMap, closeTrafficLiveMap } from './traffic-live-map.js';

const BLUE = '#00d4ff';
const BLUE_DARK = '#185FA5';
const BLUE_SOFT = '#69c7e8';
const GREEN = '#1D9E75';
const AMBER = '#EF9F27';
const RED = '#E24B4A';

const trafficCameraConfigs = [
  {
    id: 'north',
    label: 'Bắc',
    status: 'OK',
    icon: 'ti-camera',
    tone: 'ok',
    tag: 'CAM A4-01',
    title: 'Camera hướng Bắc',
    summary: 'Giám sát dòng xe vào nút A4 từ trục Bắc, ưu tiên phát hiện hàng chờ và xe dừng sai làn.',
    route: ['Tín hiệu', 'AI VMS', 'Đội giao thông'],
    stats: [['Trạng thái', 'Online'], ['Trễ hình', '0.8s'], ['SLA', '98%']],
    steps: ['Giữ chu kỳ đèn hiện tại', 'Theo dõi mật độ trong 5 phút', 'Đồng bộ cảnh báo về bảng điều hành'],
    statusText: 'Camera Bắc đang ổn định, chưa cần điều phối lại pha đèn.',
    done: 'Đã xác nhận camera Bắc và cập nhật trạng thái theo dõi nút A4.',
  },
  {
    id: 'south',
    label: 'Nam',
    status: 'OK',
    icon: 'ti-camera',
    tone: 'ok',
    tag: 'CAM A4-02',
    title: 'Camera hướng Nam',
    summary: 'Kiểm tra luồng xe từ hướng Nam và nhận diện xe rẽ trái bất thường tại vạch dừng.',
    route: ['Camera', 'Phân tích', 'Tổ trực A4'],
    stats: [['Trạng thái', 'Online'], ['Tốc độ TB', '32km/h'], ['Tin cậy', '96%']],
    steps: ['Kiểm tra làn rẽ trái', 'Ghim feed lên màn hình IOC', 'Gửi nhắc trực nếu tốc độ giảm'],
    statusText: 'Camera Nam đang truyền feed tốt, luồng xe vẫn trong ngưỡng.',
    done: 'Đã ghim feed Nam cho ca trực giao thông.',
  },
  {
    id: 'east',
    label: 'Đông',
    status: '72%',
    icon: 'ti-camera-exclamation',
    tone: 'warn',
    tag: 'CAM A4-03',
    title: 'Camera hướng Đông',
    summary: 'Feed hướng Đông có mức tin cậy 72%, cần theo dõi thêm do mật độ xe tăng nhanh gần giờ cao điểm.',
    route: ['Cảnh báo', 'Camera Đông', 'Điều phối đèn'],
    stats: [['Tin cậy', '72%'], ['Hàng chờ', '140m'], ['Ưu tiên', '+12s']],
    steps: ['Mở rộng pha xanh hướng Đông', 'Kiểm tra lại vùng nhận diện', 'Báo đội hiện trường nếu feed tiếp tục giảm'],
    statusText: 'Camera Đông cần cảnh báo: độ tin cậy 72% và hàng chờ đang tăng.',
    done: 'Đã kích hoạt theo dõi camera Đông và đề xuất cộng thêm 12 giây pha xanh.',
  },
  {
    id: 'west',
    label: 'Tây',
    status: 'OK',
    icon: 'ti-camera',
    tone: 'ok',
    tag: 'CAM A4-04',
    title: 'Camera hướng Tây',
    summary: 'Theo dõi dòng xe thoát nút A4 về phía Tây, đảm bảo không tràn làn xe bus vào làn xe máy.',
    route: ['Camera', 'Làn ưu tiên', 'Giám sát'],
    stats: [['Trạng thái', 'Online'], ['Mật độ', 'Trung bình'], ['SLA', '97%']],
    steps: ['Giữ làn ưu tiên mở', 'So khớp với cảm biến mặt đường', 'Cập nhật nếu mật độ tăng'],
    statusText: 'Camera Tây ổn định, tốc độ thoát nút đang đạt mức bình thường.',
    done: 'Đã xác nhận camera Tây và tiếp tục giám sát làn ưu tiên.',
  },
  {
    id: 'turn',
    label: 'Rẽ',
    status: 'OK',
    icon: 'ti-camera',
    tone: 'ok',
    tag: 'CAM A4-05',
    title: 'Camera làn rẽ',
    summary: 'Tập trung vào làn rẽ tại nút A4 để phát hiện xe đổi làn muộn và nguy cơ va chạm nhẹ.',
    route: ['Làn rẽ', 'AI nhận diện', 'Cảnh báo'],
    stats: [['Trạng thái', 'Online'], ['Vi phạm', '2'], ['Rủi ro', 'Thấp']],
    steps: ['Theo dõi xe đổi làn', 'Bật cảnh báo nếu vi phạm tăng', 'Đồng bộ với bảng sự cố'],
    statusText: 'Camera làn rẽ đang ghi nhận 2 vi phạm nhẹ, chưa cần can thiệp.',
    done: 'Đã cập nhật camera làn rẽ vào danh sách theo dõi.',
  },
  {
    id: 'line',
    label: 'Vạch',
    status: 'OK',
    icon: 'ti-camera',
    tone: 'ok',
    tag: 'CAM A4-06',
    title: 'Camera vạch dừng',
    summary: 'Kiểm tra khu vực vạch dừng và hành vi lấn qua vạch khi đèn đỏ tại giao lộ A4.',
    route: ['Vạch dừng', 'Xử lý ảnh', 'Tổ trực'],
    stats: [['Trạng thái', 'Online'], ['Lấn vạch', '1'], ['Tin cậy', '95%']],
    steps: ['Kiểm tra khung hình vạch dừng', 'Ghi nhận vi phạm nếu lặp lại', 'Liên kết cảnh báo với đèn đỏ'],
    statusText: 'Camera vạch dừng ổn định, chỉ có 1 lần vượt vạch trong chu kỳ gần nhất.',
    done: 'Đã xác nhận camera vạch dừng và lưu nhật ký theo dõi.',
  },
];

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function piePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

function piePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${piePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${piePoint(cx, cy, r, end)} Z`;
}

function trafficPie3d(items) {
  let angle = -22;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const slices = items.map((item) => {
    const span = item.value / total * 360;
    const path = piePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = piePoint(58, 58, 34, mid).split(' ');
    const pin = piePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...item, path, dot, pin };
  });
  return `<div class="traffic-viz-pie">
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

function flowLineChart(chart) {
  const values = chart.values;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => {
    const x = 8 + i * (118 / (values.length - 1));
    const y = 74 - ((value - min) / range) * 48;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,78 ${points.join(' ')} 126,78`;
  return `<div class="traffic-viz-flow">
    <svg viewBox="0 0 136 86" aria-hidden="true">
      <defs><linearGradient id="trafficFlowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${BLUE_DARK}" stop-opacity="0.04"/>
      </linearGradient></defs>
      <g class="traffic-viz-flow__grid">
        ${[24, 42, 60, 78].map((y) => `<line x1="8" y1="${y}" x2="126" y2="${y}"/>`).join('')}
        ${chart.labels.map((label, i) => `<text x="${8 + i * (118 / (chart.labels.length - 1))}" y="84" text-anchor="middle">${label}</text>`).join('')}
      </g>
      <polygon points="${area}" fill="url(#trafficFlowGrad)"/>
      <polyline class="traffic-viz-flow__line" points="${points.join(' ')}"/>
      ${points.map((point, i) => {
    const [x, y] = point.split(',');
    return `<circle cx="${x}" cy="${y}" r="${i === points.length - 1 ? 3.4 : 2.4}"/>`;
  }).join('')}
    </svg>
    <div class="traffic-viz-flow__metric"><i class="ti ti-road"></i><strong>${chart.current}</strong><span>${chart.label}</span></div>
  </div>`;
}

function compactCameraGrid(feeds) {
  const cameraItems = feeds.map((feed, index) => ({
    ...trafficCameraConfigs[index],
    label: feed.label || trafficCameraConfigs[index]?.label || `Cam ${index + 1}`,
  }));
  const hub = { x: 50, y: 33 };
  const positions = [
    { x: 50, y: 8 },
    { x: 71.7, y: 20.5 },
    { x: 71.7, y: 45.5 },
    { x: 50, y: 58 },
    { x: 28.3, y: 45.5 },
    { x: 28.3, y: 20.5 },
  ];
  return `<div class="traffic-camera-map">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="traffic-camera-map__ring" cx="${hub.x}" cy="${hub.y}" r="22"/>
      <circle class="traffic-camera-map__pulse" cx="${hub.x}" cy="${hub.y}" r="12"/>
      ${positions.map((p, index) => `<line class="traffic-camera-map__link traffic-camera-map__link--${cameraItems[index]?.tone || 'ok'}" x1="${hub.x}" y1="${hub.y}" x2="${p.x}" y2="${p.y}"/>`).join('')}
    </svg>
    <button type="button" class="traffic-camera-map__play" data-traffic-live aria-label="Mở camera 2D nút A4 thời gian thực" style="--x:${hub.x}%;--y:${hub.y}%">
      <i class="ti ti-player-play-filled"></i>
    </button>
    ${cameraItems.map((f, index) => {
    const pos = positions[index] || positions[0];
    return `<button type="button" class="traffic-camera-node traffic-camera-node--${f.tone} traffic-camera-node--${f.id}" data-traffic-camera="${f.id}" aria-label="Mở popup ${f.title}" style="--x:${pos.x}%;--y:${pos.y}%">
      <span>${f.status}</span><b>${f.label}</b>
    </button>`;
  }).join('')}
    <div class="traffic-camera-map__actions" aria-label="Mở nhanh camera nút A4">
      ${cameraItems.map((f) => `<button type="button" class="traffic-camera-action traffic-camera-action--${f.tone}" data-traffic-camera="${f.id}" aria-label="Mở popup ${f.title}">
        <b>${f.label}</b><span>${f.status}</span>
      </button>`).join('')}
    </div>
    <div class="traffic-camera-map__summary">
      <b>Camera nút A4</b><em>6 hướng · 5 OK · 1 cảnh báo</em>
    </div>
  </div>`;
}

function trafficCameraModal() {
  return `<div class="traffic-camera-modal" data-traffic-camera-modal hidden>
    <button type="button" class="traffic-camera-modal__backdrop" data-traffic-camera-close aria-label="Đóng"></button>
    <section class="traffic-camera-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối camera nút A4">
      <button type="button" class="traffic-camera-modal__close" data-traffic-camera-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="traffic-camera-modal__head">
        <span class="traffic-camera-modal__icon"><i class="ti ti-camera" data-traffic-camera-icon></i></span>
        <div><small data-traffic-camera-tag>CAM A4</small><h3 data-traffic-camera-title>Camera nút A4</h3></div>
      </div>
      <p data-traffic-camera-summary></p>
      <div class="traffic-camera-modal__route" data-traffic-camera-route></div>
      <div class="traffic-camera-modal__stats" data-traffic-camera-stats></div>
      <div class="traffic-camera-modal__steps" data-traffic-camera-steps></div>
      <div class="traffic-camera-modal__status"><i class="ti ti-broadcast"></i><span data-traffic-camera-status>Chờ xác nhận thao tác camera.</span></div>
      <button type="button" class="traffic-camera-modal__primary" data-traffic-camera-confirm>
        <i class="ti ti-send"></i><span>Xác nhận theo dõi</span>
      </button>
    </section>
  </div>`;
}

function trafficLiveModal() {
  return `<div class="traffic-live-modal" data-traffic-live-modal hidden>
    <button type="button" class="traffic-live-modal__backdrop" data-traffic-live-close aria-label="Đóng"></button>
    <section class="traffic-live-modal__panel" role="dialog" aria-modal="true" aria-label="Camera 2D nút A4 thời gian thực">
      <button type="button" class="traffic-live-modal__close" data-traffic-live-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="traffic-live-modal__head">
        <span class="traffic-live-modal__icon"><i class="ti ti-map-2"></i></span>
        <div>
          <small>CAM A4 · LIVE 2D</small>
          <h3>Camera 2D nút A4</h3>
        </div>
        <span class="traffic-live-modal__live"><i></i>Trực tiếp</span>
      </div>
      <div class="traffic-live-modal__stage">
        <canvas data-traffic-live-canvas></canvas>
        <p class="traffic-live-modal__hint" data-traffic-live-status hidden>Đang kết nối luồng giao thông 3D…</p>
      </div>
      <div class="traffic-live-modal__counts" aria-label="Số lượng phương tiện theo thời gian thực">
        <span class="traffic-live-count traffic-live-count--total"><i class="ti ti-car-suv"></i><b data-live-total>0</b><em>Tổng xe</em></span>
        <span class="traffic-live-count traffic-live-count--car"><i class="ti ti-car"></i><b data-live-car>0</b><em>Ô tô</em></span>
        <span class="traffic-live-count traffic-live-count--moto"><i class="ti ti-motorbike"></i><b data-live-moto>0</b><em>Xe máy</em></span>
      </div>
    </section>
  </div>`;
}

function getTrafficCameraModal(root = document) {
  const modal = root.querySelector('[data-traffic-camera-modal]') || document.querySelector('[data-traffic-camera-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-traffic-camera-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function openTrafficCameraModal(root, cameraId) {
  const config = trafficCameraConfigs.find((item) => item.id === cameraId);
  const modal = getTrafficCameraModal(root);
  if (!config || !modal) return;
  modal.querySelector('[data-traffic-camera-icon]').className = `ti ${config.icon}`;
  modal.querySelector('[data-traffic-camera-tag]').textContent = config.tag;
  modal.querySelector('[data-traffic-camera-title]').textContent = config.title;
  modal.querySelector('[data-traffic-camera-summary]').textContent = config.summary;
  modal.querySelector('[data-traffic-camera-status]').textContent = config.statusText;
  modal.querySelector('[data-traffic-camera-confirm]').hidden = false;
  modal.querySelector('[data-traffic-camera-route]').innerHTML = config.route
    .map((item, index) => `${index ? '<i></i>' : ''}<span>${item}</span>`)
    .join('');
  modal.querySelector('[data-traffic-camera-stats]').innerHTML = config.stats
    .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
    .join('');
  modal.querySelector('[data-traffic-camera-steps]').innerHTML = config.steps
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.dataset.doneStatus = config.done;
  modal.hidden = false;
}

function incidentMatrix(incidents) {
  return `<div class="traffic-viz-matrix">
    ${incidents.items.map((item) => `<span class="traffic-viz-matrix__cell traffic-viz-matrix__cell--${item.tone}">
      <b>${item.value}</b><em>${item.label}</em>
    </span>`).join('')}
  </div>`;
}

export function renderTrafficLeftSidebar(d) {
  return `
    <section class="hud-block traffic-viz-block">${hudHead(d.flow.title)}
      ${trafficPie3d(d.flow.groups)}
    </section>
    <section class="hud-block traffic-viz-block">${hudHead('Vi phạm giao thông')}
      ${renderTrafficViolations()}
    </section>
    <section class="hud-block traffic-viz-block">${hudHead(d.flow.trend.title)}
      ${flowLineChart(d.flow.trend)}
    </section>
    <section class="hud-block traffic-viz-block">${hudHead(d.cameras.title)}
      ${compactCameraGrid(d.cameras.feeds)}
    </section>
    ${trafficCameraModal()}
    ${trafficLiveModal()}
    ${redLightModal()}`;
}

function getTrafficLiveModal(root = document) {
  const modal = root.querySelector('[data-traffic-live-modal]') || document.querySelector('[data-traffic-live-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-traffic-live-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

export function bindTrafficCameraModal() {
  if (document.documentElement.dataset.trafficCameraModalBound === 'true') return;
  document.documentElement.dataset.trafficCameraModalBound = 'true';
  document.addEventListener('click', (event) => {
    const liveBtn = event.target.closest('[data-traffic-live]');
    if (liveBtn) {
      const modal = getTrafficLiveModal(liveBtn.closest('#page-traffic') || document);
      if (modal) {
        modal.hidden = false;
        openTrafficLiveMap(modal);
      }
      return;
    }

    const liveModal = document.querySelector('[data-traffic-live-modal]:not([hidden])');
    if (liveModal && event.target.closest('[data-traffic-live-close]')) {
      liveModal.hidden = true;
      closeTrafficLiveMap();
      return;
    }

    const cameraBtn = event.target.closest('[data-traffic-camera]');
    if (cameraBtn) {
      openTrafficCameraModal(cameraBtn.closest('#page-traffic') || document, cameraBtn.dataset.trafficCamera);
      return;
    }

    const activeModal = document.querySelector('[data-traffic-camera-modal]:not([hidden])');
    if (!activeModal) return;
    if (event.target.closest('[data-traffic-camera-close]')) {
      activeModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-traffic-camera-confirm]')) {
      activeModal.querySelector('[data-traffic-camera-status]').textContent =
        activeModal.dataset.doneStatus || 'Đã xác nhận theo dõi camera nút A4.';
      activeModal.querySelector('[data-traffic-camera-confirm]').hidden = true;
    }
  });
}
