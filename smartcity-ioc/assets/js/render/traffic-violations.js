const redLightCases = [
  {
    id: 'RL-A4-019',
    plate: '30F-582.91',
    lane: 'Hướng Đông',
    time: '18:42:16',
    speed: '41km/h',
    confidence: '96%',
    status: 'Chờ xác minh',
    tone: 'danger',
    camera: 'CAM A4-03',
    sequence: ['Đèn đỏ 02s', 'Xe qua vạch', 'Cắt ngang làn Bắc', 'Đã trích xuất clip'],
  },
  {
    id: 'RL-A4-017',
    plate: '29H-104.22',
    lane: 'Làn rẽ phải',
    time: '18:31:04',
    speed: '28km/h',
    confidence: '91%',
    status: 'Đã gán đội xử lý',
    tone: 'warn',
    camera: 'CAM A4-05',
    sequence: ['Giảm tốc', 'Lấn vạch', 'Rẽ khi đỏ', 'Đã gửi cảnh báo'],
  },
  {
    id: 'RL-A4-012',
    plate: '30K-776.10',
    lane: 'Hướng Nam',
    time: '18:08:49',
    speed: '36km/h',
    confidence: '88%',
    status: 'Đã lưu hồ sơ',
    tone: 'ok',
    camera: 'CAM A4-02',
    sequence: ['Đèn vàng', 'Đỏ 01s', 'Qua giao lộ', 'Đối soát xong'],
  },
];

export function renderTrafficViolations() {
  const pct = 7;
  const total = 37;
  const axes = [
    { label: 'A4', value: '37', score: 0.72 },
    { label: 'Đông', value: '12', score: 0.86 },
    { label: 'Nam', value: '9', score: 0.62 },
    { label: 'Rẽ', value: '7', score: 0.5 },
    { label: 'Vạch', value: '95%', score: 0.68 },
    { label: 'AI', value: '96%', score: 0.9 },
  ];
  const cx = 68;
  const cy = 58;
  const maxR = 42;
  const point = (index, radius) => {
    const angle = (-90 + index * (360 / axes.length)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  };
  const ring = (radius) => axes.map((_, index) => point(index, radius)).join(' ');
  const shape = axes.map((axis, index) => point(index, maxR * axis.score)).join(' ');
  const axisLabelOffsets = {
    A4: [0, 10],
    Vạch: [-6, 7],
  };
  const axisLines = axes.map((axis, index) => {
    const [x2, y2] = point(index, maxR).split(',');
    const [tx, ty] = point(index, 58).split(',').map(Number);
    const [ldx, ldy] = axisLabelOffsets[axis.label] || [0, 0];
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/>
      <text x="${(tx + ldx).toFixed(1)}" y="${(ty + ldy).toFixed(1)}" text-anchor="middle">${axis.label}</text>`;
  }).join('');
  const metricPoints = axes.map((axis, index) => {
    const angle = (-90 + index * (360 / axes.length)) * Math.PI / 180;
    const [x, y] = point(index, maxR * axis.score).split(',').map(Number);
    const labelOffsets = {
      'Nam': [6, 9],
      'Rẽ': [0, 12],
      'Vạch': [-4, 12],
    };
    const [dx, dy] = labelOffsets[axis.label] || [Math.cos(angle) * 4, -7];
    const labelX = x + dx;
    const labelY = y + dy;
    return `<g class="traffic-redlight-radar__metric">
      <circle cx="${x}" cy="${y}" r="2.2"/>
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle">${axis.value}</text>
    </g>`;
  }).join('');

  return `<div class="traffic-redlight">
    <div class="traffic-redlight__top">
      <span><b>${pct}%</b><em>Tỉ lệ vi phạm</em></span>
      <span><b>${total}</b><em>Vụ / 15 phút</em></span>
      <span><b>96%</b><em>Tin cậy AI</em></span>
    </div>
    <div class="traffic-redlight__main">
      <svg class="traffic-redlight-radar" viewBox="0 0 136 120" aria-hidden="true">
        <defs>
          <linearGradient id="redlightRadarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8fefff" stop-opacity="0.76"/>
            <stop offset="100%" stop-color="#2d8fff" stop-opacity="0.58"/>
          </linearGradient>
        </defs>
        <g class="traffic-redlight-radar__grid">
          <polygon points="${ring(18)}"/>
          <polygon points="${ring(32)}"/>
          <polygon points="${ring(maxR)}"/>
          ${axisLines}
        </g>
        <polygon class="traffic-redlight-radar__shadow" points="${shape}"/>
        <polygon class="traffic-redlight-radar__shape" points="${shape}"/>
        ${metricPoints}
      </svg>
    </div>
    <div class="traffic-redlight__caption">
      <b>Vượt đèn đỏ</b><em>Radar mức vi phạm theo điểm</em>
    </div>
    <button type="button" class="traffic-redlight__action" data-redlight-open>
      <i class="ti ti-traffic-lights-off"></i><span>Xử lý vượt đèn đỏ</span>
    </button>
  </div>`;
}

export function redLightModal() {
  const first = redLightCases[0];
  return `<div class="traffic-redlight-modal" data-redlight-modal hidden>
    <button type="button" class="traffic-redlight-modal__backdrop" data-redlight-close aria-label="Đóng"></button>
    <section class="traffic-redlight-modal__panel" role="dialog" aria-modal="true" aria-label="Xử lý vượt đèn đỏ">
      <button type="button" class="traffic-redlight-modal__close" data-redlight-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="traffic-redlight-modal__head">
        <span class="traffic-redlight-modal__icon"><i class="ti ti-traffic-lights-off"></i></span>
        <div><small>NÚT A4 · AI VI PHẠM</small><h3>Xử lý vượt đèn đỏ</h3></div>
      </header>
      <div class="traffic-redlight-modal__layout">
        <div class="traffic-redlight-modal__cases" data-redlight-case-list>
          ${redLightCases.map((item, index) => `<button type="button" class="traffic-redlight-case traffic-redlight-case--${item.tone}${index === 0 ? ' traffic-redlight-case--active' : ''}" data-redlight-case="${item.id}">
            <span><b>${item.plate}</b><em>${item.id}</em></span>
            <strong>${item.time}</strong>
          </button>`).join('')}
        </div>
        <div class="traffic-redlight-modal__detail">
          <div class="traffic-redlight-feed" data-redlight-feed>
            <div class="traffic-redlight-feed__road">
              <span class="traffic-redlight-feed__lane traffic-redlight-feed__lane--a"></span>
              <span class="traffic-redlight-feed__lane traffic-redlight-feed__lane--b"></span>
              <span class="traffic-redlight-feed__stop"></span>
              <span class="traffic-redlight-feed__signal"></span>
              <span class="traffic-redlight-feed__car"></span>
            </div>
            <div class="traffic-redlight-feed__hud">
              <span data-redlight-camera>${first.camera}</span>
              <b data-redlight-plate>${first.plate}</b>
              <em data-redlight-speed>${first.speed}</em>
            </div>
          </div>
          <div class="traffic-redlight-modal__metrics">
            <span><b data-redlight-lane>${first.lane}</b><em>Hướng/làn</em></span>
            <span><b data-redlight-confidence>${first.confidence}</b><em>Tin cậy AI</em></span>
            <span><b data-redlight-status>${first.status}</b><em>Trạng thái</em></span>
          </div>
          <div class="traffic-redlight-modal__timeline" data-redlight-timeline>
            ${first.sequence.map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`).join('')}
          </div>
          <div class="traffic-redlight-modal__status"><i class="ti ti-broadcast"></i><span data-redlight-action-status>Chọn trường hợp để kiểm tra camera hành trình và tạo hồ sơ xử lý.</span></div>
          <button type="button" class="traffic-redlight-modal__primary" data-redlight-confirm>
            <i class="ti ti-file-check"></i><span>Tạo hồ sơ xử lý</span>
          </button>
        </div>
      </div>
    </section>
  </div>`;
}

function getRedLightModal(root = document) {
  const modal = root.querySelector('[data-redlight-modal]') || document.querySelector('[data-redlight-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-redlight-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function setRedLightCase(modal, caseId) {
  const item = redLightCases.find((entry) => entry.id === caseId) || redLightCases[0];
  if (!modal || !item) return;
  modal.querySelectorAll('[data-redlight-case]').forEach((btn) => {
    btn.classList.toggle('traffic-redlight-case--active', btn.dataset.redlightCase === item.id);
  });
  modal.querySelector('[data-redlight-camera]').textContent = item.camera;
  modal.querySelector('[data-redlight-plate]').textContent = item.plate;
  modal.querySelector('[data-redlight-speed]').textContent = item.speed;
  modal.querySelector('[data-redlight-lane]').textContent = item.lane;
  modal.querySelector('[data-redlight-confidence]').textContent = item.confidence;
  modal.querySelector('[data-redlight-status]').textContent = item.status;
  modal.querySelector('[data-redlight-timeline]').innerHTML = item.sequence
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.querySelector('[data-redlight-action-status]').textContent = `${item.plate} · ${item.time}: đang xem lại camera hành trình ${item.camera}.`;
  modal.querySelector('[data-redlight-confirm]').hidden = false;
  modal.dataset.activeCase = item.id;
}

export function bindRedLightModal() {
  if (document.documentElement.dataset.redLightModalBound === 'true') return;
  document.documentElement.dataset.redLightModalBound = 'true';
  document.addEventListener('click', (event) => {
    const openBtn = event.target.closest('[data-redlight-open]');
    if (openBtn) {
      const modal = getRedLightModal(openBtn.closest('#page-traffic') || document);
      if (!modal) return;
      setRedLightCase(modal, redLightCases[0].id);
      modal.hidden = false;
      return;
    }

    const activeModal = document.querySelector('[data-redlight-modal]:not([hidden])');
    if (!activeModal) return;
    const caseBtn = event.target.closest('[data-redlight-case]');
    if (caseBtn) {
      setRedLightCase(activeModal, caseBtn.dataset.redlightCase);
      return;
    }
    if (event.target.closest('[data-redlight-close]')) {
      activeModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-redlight-confirm]')) {
      const item = redLightCases.find((entry) => entry.id === activeModal.dataset.activeCase) || redLightCases[0];
      activeModal.querySelector('[data-redlight-action-status]').textContent =
        `Đã tạo hồ sơ xử lý ${item.id} cho biển số ${item.plate}; clip hành trình đã gắn vào biên bản.`;
      activeModal.querySelector('[data-redlight-confirm]').hidden = true;
    }
  });
}
