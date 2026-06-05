import { hudHead, ringSvg } from './hud-charts.js';
import { setRoofProgress, getRoofProgress } from '../scene/stadium-scene-registry.js';

let roofAnim = null;

const facilityActions = {
  hvac: {
    icon: 'ti-air-conditioning',
    tag: 'HVAC OPS',
    title: 'Tăng HVAC-B',
    summary: 'Tăng công suất HVAC-B theo ngưỡng an toàn, ưu tiên khu khán đài B và giữ tải tổng dưới mức cảnh báo.',
    route: ['BMS', 'HVAC-B', 'Khán đài B'],
    stats: [
      ['Tải hiện tại', '92%'],
      ['Mục tiêu', '84%'],
      ['ETA', '06 phút'],
    ],
    steps: ['Mở thêm 2 damper hồi gió', 'Tăng quạt cấp lên mức 4', 'Theo dõi nhiệt độ khu B'],
    primary: 'Kích hoạt HVAC-B',
    status: 'Chờ xác nhận tăng công suất HVAC-B.',
    done: 'Đã gửi lệnh tăng HVAC-B tới BMS và đội kỹ thuật.',
  },
  ups: {
    icon: 'ti-bolt',
    tag: 'POWER OPS',
    title: 'Chuyển UPS',
    summary: 'Chuyển tải ưu tiên sang UPS dự phòng cho các node quan trọng trước khi đỉnh tải 24h chạm ngưỡng.',
    route: ['Lưới', 'UPS-B', 'Node ưu tiên'],
    stats: [
      ['Dự phòng', '38 phút'],
      ['Tải UPS', '61%'],
      ['Rủi ro', 'Thấp'],
    ],
    steps: ['Khóa tải không ưu tiên', 'Chuyển tuyến UPS-B', 'Xác nhận điện áp ổn định'],
    primary: 'Chuyển sang UPS',
    status: 'Chờ xác nhận chuyển tải UPS.',
    done: 'Đã gửi lệnh chuyển UPS và bật giám sát điện áp.',
  },
  lighting: {
    icon: 'ti-bulb',
    tag: 'LIGHT OPS',
    title: 'Giảm tải đèn',
    summary: 'Giảm tải chiếu sáng theo vùng phụ trợ, giữ nguyên độ sáng khu khán giả và lối thoát hiểm.',
    route: ['BMS', 'Lighting', 'Vùng phụ trợ'],
    stats: [
      ['Tiết kiệm', '12%'],
      ['Lux sân', 'OK'],
      ['ETA', '03 phút'],
    ],
    steps: ['Giảm 15% đèn hành lang', 'Giữ sáng exit route', 'Theo dõi lux khu sân'],
    primary: 'Giảm tải đèn',
    status: 'Chờ xác nhận giảm tải chiếu sáng.',
    done: 'Đã gửi lệnh giảm tải đèn cho các vùng phụ trợ.',
  },
  monitor: {
    icon: 'ti-radar',
    tag: 'SYSTEM MONITOR',
    title: 'Giám sát hệ thống kỹ thuật',
    summary: 'Mở lớp giám sát realtime cho HVAC, chiếu sáng, UPS, thang máy và mái vòm để đội vận hành theo dõi đồng bộ.',
    route: ['Sensor', 'BMS', 'VOC'],
    stats: [
      ['Node online', '6/6'],
      ['Cảnh báo', '1'],
      ['Chu kỳ quét', '5 giây'],
    ],
    steps: ['Đồng bộ telemetry BMS', 'Highlight node tải cao', 'Gửi snapshot cho kỹ thuật'],
    primary: 'Bật giám sát',
    status: 'Chờ xác nhận mở lớp giám sát hệ thống.',
    done: 'Đã bật lớp giám sát kỹ thuật và đồng bộ telemetry realtime.',
  },
  roof: {
    icon: 'ti-building-arch',
    tag: 'ROOF CONTROL',
    title: 'Điều khiển mái vòm',
    summary: 'Mở bảng điều khiển mái PTFE ở chế độ có xác nhận, ưu tiên an toàn gió, tải motor và trạng thái khóa cơ khí.',
    route: ['VOC', 'PLC mái', 'Motor PTFE'],
    stats: [
      ['Trạng thái', 'Mở'],
      ['Gió', 'OK'],
      ['Khóa cơ', 'Ready'],
    ],
    steps: ['Kiểm tra liên động an toàn', 'Chọn mở, đóng hoặc dừng', 'Theo dõi tiến trình PLC'],
    primary: 'Mở điều khiển mái',
    status: 'Chờ xác nhận mở bảng điều khiển mái.',
    done: 'Đã mở quyền điều khiển mái và khóa thao tác song song.',
  },
  bms: {
    icon: 'ti-building-factory-2',
    tag: 'BMS CORE',
    title: 'BMS trung tâm',
    summary: 'Theo dõi lõi BMS đang gom dữ liệu HVAC, chiếu sáng, thang máy, UPS và mái vòm trong chu kỳ realtime.',
    route: ['Sensor', 'BMS', 'IOC'],
    stats: [
      ['Node online', '24/24'],
      ['Latency', '42 ms'],
      ['Cảnh báo', '1'],
    ],
    steps: ['Đồng bộ lại telemetry', 'Kiểm tra cảnh báo HVAC-B', 'Gửi snapshot cho đội kỹ thuật'],
    primary: 'Đồng bộ BMS',
    status: 'Chờ xác nhận đồng bộ dữ liệu BMS.',
    done: 'Đã đồng bộ BMS và cập nhật telemetry realtime.',
  },
  temp: {
    icon: 'ti-temperature',
    tag: 'THERMAL',
    title: 'Nhiệt độ trung bình',
    summary: 'Chi tiết nhiệt độ các vùng khán đài và sân, kèm thao tác cân bằng tải HVAC khi khu B tăng nhiệt.',
    route: ['Cảm biến', 'HVAC', 'Khán đài'],
    stats: [
      ['Trung bình', '24°C'],
      ['Khu cao nhất', 'B 26°C'],
      ['Ngưỡng', '28°C'],
    ],
    steps: ['Tăng gió khu B', 'Mở thêm damper hồi', 'Theo dõi 5 phút sau lệnh'],
    primary: 'Điều chỉnh HVAC',
    status: 'Chờ xác nhận điều chỉnh HVAC theo nhiệt độ.',
    done: 'Đã gửi lệnh điều chỉnh HVAC theo bản đồ nhiệt.',
  },
  light: {
    icon: 'ti-bulb',
    tag: 'LIGHTING',
    title: 'Chiếu sáng sân',
    summary: 'Theo dõi lux sân, đèn floodlight và vùng phụ trợ để giữ hình ảnh thi đấu ổn định nhưng giảm tải khi cần.',
    route: ['BMS', 'Floodlight', 'Sân'],
    stats: [
      ['Độ sáng', '1200 lux'],
      ['Đèn online', '100%'],
      ['Dư tải', '12%'],
    ],
    steps: ['Giữ lux sân thi đấu', 'Giảm vùng phụ trợ 10%', 'Kiểm tra camera broadcast'],
    primary: 'Cân bằng lux',
    status: 'Chờ xác nhận cân bằng chiếu sáng.',
    done: 'Đã gửi lệnh cân bằng lux và giảm tải vùng phụ trợ.',
  },
  elevator: {
    icon: 'ti-elevator',
    tag: 'ELEVATOR',
    title: 'Thang máy',
    summary: 'Chi tiết tình trạng 16 thang máy, ưu tiên luồng VIP, y tế và kỹ thuật trong thời điểm sân đông.',
    route: ['BMS', 'Thang máy', 'Đội bảo trì'],
    stats: [
      ['Hoạt động', '14/16'],
      ['Bảo trì', 'TM-3, TM-7'],
      ['Ưu tiên', 'VIP/Y tế'],
    ],
    steps: ['Khóa 2 thang bảo trì', 'Ưu tiên cabin VIP', 'Gửi đội kỹ thuật sau trận'],
    primary: 'Gửi đội bảo trì',
    status: 'Chờ xác nhận điều phối thang máy.',
    done: 'Đã gửi lệnh điều phối thang máy và ticket bảo trì.',
  },
  roofstatus: {
    icon: 'ti-building-arch',
    tag: 'ROOF STATUS',
    title: 'Trạng thái mái vòm',
    summary: 'Theo dõi trạng thái mái PTFE, gió, motor và khóa cơ khí trước khi cho phép thao tác mở, đóng hoặc dừng.',
    route: ['BMS', 'PLC mái', 'Mái PTFE'],
    stats: [
      ['Trạng thái', 'Mở'],
      ['Motor', 'Ổn định'],
      ['Gió', 'OK'],
    ],
    steps: ['Kiểm tra khóa cơ khí', 'Xác nhận gió an toàn', 'Mở quyền điều khiển PLC'],
    primary: 'Mở điều khiển mái',
    status: 'Chờ xác nhận mở chi tiết mái vòm.',
    done: 'Đã mở chi tiết mái vòm và khóa thao tác song song.',
  },
  alertHvac: {
    icon: 'ti-air-conditioning',
    tag: 'CẢNH BÁO HVAC',
    title: 'HVAC khán đài B tải 92%',
    summary: 'HVAC-B đang vượt ngưỡng tải vận hành. Ưu tiên giảm nhiệt khu B, san tải sang HVAC-A và theo dõi sau lệnh.',
    route: ['Cảnh báo', 'HVAC-B', 'Kỹ thuật'],
    stats: [
      ['Tải hiện tại', '92%'],
      ['Thời gian', '20 phút'],
      ['Mức ưu tiên', 'Cao'],
    ],
    steps: ['Tăng gió cấp khu B', 'San tải sang HVAC-A', 'Gửi đội kỹ thuật kiểm tra coil'],
    primary: 'Xử lý HVAC-B',
    status: 'Chờ xác nhận xử lý cảnh báo HVAC-B.',
    done: 'Đã gửi quy trình xử lý HVAC-B và bật theo dõi 5 phút.',
  },
  alertRoof: {
    icon: 'ti-building-arch',
    tag: 'THÔNG TIN MÁI',
    title: 'Mái vòm mở hoàn toàn',
    summary: 'Mái vòm PTFE đang ở trạng thái mở 100%. Có thể kiểm tra liên động, khóa thao tác hoặc chuyển sang chế độ điều khiển có xác nhận.',
    route: ['BMS', 'PLC mái', 'VOC'],
    stats: [
      ['Trạng thái', '100%'],
      ['Cập nhật', '45 phút'],
      ['Liên động', 'OK'],
    ],
    steps: ['Kiểm tra gió và motor', 'Khóa thao tác song song', 'Sẵn sàng điều khiển mái'],
    primary: 'Kiểm tra mái',
    status: 'Chờ xác nhận kiểm tra trạng thái mái vòm.',
    done: 'Đã kiểm tra mái vòm và khóa thao tác song song.',
  },
  alertMaintenance: {
    icon: 'ti-tool',
    tag: 'BẢO TRÌ',
    title: 'TM-3, TM-7 sau trận',
    summary: 'Hai thang máy được đánh dấu bảo trì sau trận. Cần tạo ticket, khóa lịch vận hành và phân công đội kỹ thuật.',
    route: ['BMS', 'Thang máy', 'Bảo trì'],
    stats: [
      ['Trạng thái', 'OK'],
      ['Thời gian', '1 giờ'],
      ['Thiết bị', 'TM-3, TM-7'],
    ],
    steps: ['Tạo ticket bảo trì', 'Khóa lịch vận hành sau trận', 'Phân công đội thang máy'],
    primary: 'Tạo ticket bảo trì',
    status: 'Chờ xác nhận tạo ticket bảo trì.',
    done: 'Đã tạo ticket bảo trì TM-3, TM-7 và phân công đội kỹ thuật.',
  },
};

function facilityActionModal() {
  return `<div class="fac-action-modal" data-fac-action-modal hidden>
    <div class="fac-action-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối hạ tầng">
      <button type="button" class="event-action-modal__close" data-fac-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-air-conditioning" data-fac-action-icon></i></span>
        <div><small data-fac-action-tag>HVAC OPS</small><h3 data-fac-action-title>Tăng HVAC-B</h3></div>
      </div>
      <p data-fac-action-summary></p>
      <div class="fac-action-modal__route" data-fac-action-route></div>
      <div class="fac-action-modal__stats" data-fac-action-stats></div>
      <div class="event-action-modal__steps" data-fac-action-steps></div>
      <div class="event-action-modal__status"><i class="ti ti-broadcast"></i><span data-fac-action-status>Chờ xác nhận thao tác hạ tầng.</span></div>
      <button type="button" class="event-action-modal__primary" data-fac-action-confirm>
        <i class="ti ti-send"></i><span data-fac-action-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

function getFacilityModal(root) {
  const modal = root.querySelector('[data-fac-action-modal]') || document.querySelector('[data-fac-action-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-fac-action-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function getSharedPowerModal() {
  const modal = document.body.querySelector('[data-power-modal]')
    || document.querySelector('#page-events [data-power-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-power-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function openSharedPowerModal({ turnOn = false, zoneName = '' } = {}) {
  const powerModal = getSharedPowerModal();
  if (!powerModal) return;
  powerModal.hidden = false;
  powerModal.dataset.powerIntent = turnOn ? 'on' : 'off';
  powerModal.dataset.powerZone = zoneName;
  powerModal.querySelector('[data-power-title]').textContent = zoneName
    ? `${turnOn ? 'Mở điện' : 'Cắt điện'} ${zoneName}`
    : `${turnOn ? 'Mở điện' : 'Cắt điện'} toàn bộ SVĐ`;
  powerModal.querySelector('[data-power-message]').textContent = zoneName
    ? `Bạn có chắc muốn ${turnOn ? 'mở điện lại' : 'tắt điện'} ${zoneName}? Thao tác này chỉ áp dụng cho khu vực được chọn.`
    : turnOn
      ? 'Bạn có chắc muốn mở điện toàn bộ hệ thống sân vận động? Các khu sẽ được cấp điện lại theo từng bước.'
      : 'Bạn có chắc chắn muốn cắt điện? Điều này sẽ cắt điện hoàn toàn hệ thống sân vận động.';
  powerModal.querySelector('[data-power-status]').textContent = zoneName
    ? `Chờ xác nhận thao tác nguồn cho ${zoneName}.`
    : 'Chờ xác nhận thao tác nguồn.';
  powerModal.querySelector('[data-power-accept]').textContent = turnOn ? 'Có, mở điện' : 'Có, cắt điện';
  powerModal.querySelector('[data-power-confirm]').hidden = false;
  powerModal.querySelectorAll('[data-power-zone]').forEach((node) => {
    const active = !!zoneName && node.dataset.powerZone === zoneName;
    node.classList.toggle('event-power-zone--selected', active);
    node.setAttribute('aria-pressed', String(active));
  });
}

function ensureFacilityPowerButton(root) {
  const actionRow = root.querySelector('.fac-action-row');
  if (!actionRow || actionRow.querySelector('[data-fac-action="powerCut"]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.facAction = 'powerCut';
  button.innerHTML = '<i class="ti ti-power"></i><span>Cắt điện</span>';
  actionRow.appendChild(button);
}

function fillFacilityActionModal(root, action) {
  const modal = getFacilityModal(root);
  if (!modal || !action) return;
  modal.querySelector('[data-fac-action-icon]').className = `ti ${action.icon}`;
  modal.querySelector('[data-fac-action-tag]').textContent = action.tag;
  modal.querySelector('[data-fac-action-title]').textContent = action.title;
  modal.querySelector('[data-fac-action-summary]').textContent = action.summary;
  modal.querySelector('[data-fac-action-status]').textContent = action.status;
  modal.querySelector('[data-fac-action-primary]').textContent = action.primary;
  modal.querySelector('[data-fac-action-route]').innerHTML = action.route
    .map((item, index) => `${index ? '<i></i>' : ''}<span>${item}</span>`)
    .join('');
  modal.querySelector('[data-fac-action-stats]').innerHTML = action.stats
    .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
    .join('');
  modal.querySelector('[data-fac-action-steps]').innerHTML = action.steps
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.dataset.doneStatus = action.done;
  modal.hidden = false;
}

export function bindFacilitiesActions(root) {
  if (!root) return;
  ensureFacilityPowerButton(root);
  if (root.dataset.facilityActionsBound) return;
  root.dataset.facilityActionsBound = 'true';
  root.addEventListener('click', (event) => {
    const modeBtn = event.target.closest('[data-fac-mode]');
    if (modeBtn && root.contains(modeBtn)) {
      const modeTabs = modeBtn.closest('[data-fac-mode-tabs]');
      const panel = root.querySelector('[data-fac-mode-panel]');
      if (modeTabs) {
        modeTabs.querySelectorAll('.hud-tab').forEach((tab) => {
          tab.classList.toggle('hud-tab--active', tab === modeBtn);
        });
      }
      if (panel) panel.innerHTML = facilityModeDiagram(modeBtn.dataset.facMode);
      return;
    }
    const btn = event.target.closest('[data-fac-action]');
    if (!btn || !root.contains(btn)) return;
    if (btn.dataset.facAction === 'powerCut') {
      openSharedPowerModal({ turnOn: false });
      return;
    }
    fillFacilityActionModal(root, facilityActions[btn.dataset.facAction]);
  });
}

function bindRoofControls(container) {
  container.querySelectorAll('[data-roof]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.roof;
      if (roofAnim) cancelAnimationFrame(roofAnim);
      const target = action === 'open' ? 1 : action === 'close' ? 0 : getRoofProgress();
      const start = getRoofProgress();
      const startTime = performance.now();
      const duration = action === 'stop' ? 0 : 12000;
      function tick(now) {
        if (action === 'stop') return;
        const t = Math.min(1, (now - startTime) / duration);
        setRoofProgress(start + (target - start) * t);
        const bar = container.querySelector('[data-roof-bar]');
        if (bar) bar.style.width = `${Math.round(getRoofProgress() * 100)}%`;
        if (t < 1) roofAnim = requestAnimationFrame(tick);
      }
      if (duration) requestAnimationFrame(tick);
    });
  });
}

function thermalMap(groups = []) {
  const cells = [
    { label: 'A', tone: 'ok' },
    { label: 'B', tone: 'warn' },
    { label: 'VIP', tone: 'ok' },
    { label: 'F&B', tone: 'warn' },
    { label: 'Sân', tone: 'ok' },
    { label: 'LED', tone: 'ok' },
    { label: 'PA', tone: 'ok' },
    { label: 'UPS', tone: 'ok' },
  ];
  const codes = ['A', 'B', 'S'];
  const minis = groups.map((g, index) =>
    `<span class="fac-mini fac-mini--${g.tone}"><b>${g.value}°</b><em>${codes[index] || 'Z'}</em></span>`,
  ).join('');
  return `<div class="fac-thermal">
    <div class="fac-thermal__dial">${ringSvg(82, 'OK')}</div>
    <div class="fac-thermal__grid">${cells.map((c) =>
    `<i class="fac-thermal__cell fac-thermal__cell--${c.tone}">${c.label}</i>`,
  ).join('')}</div>
    <div class="fac-mini-grid">${minis}</div>
  </div>`;
}

function networkDiagram(feeds = []) {
  const icons = ['ti-air-conditioning', 'ti-air-conditioning', 'ti-bulb', 'ti-bolt', 'ti-elevator', 'ti-building-arch'];
  const codes = ['HA', 'HB', 'FL', 'UP', 'TM', 'RF'];
  const nodes = feeds.map((feed, index) => {
    const angle = (-90 + index * (360 / feeds.length)) * Math.PI / 180;
    const tone = index === 1 ? 'warn' : index === 5 ? 'roof' : 'ok';
    return {
      ...feed,
      code: codes[index] || `S${index + 1}`,
      icon: icons[index] || 'ti-cpu',
      tone,
      x: 50 + Math.cos(angle) * 36,
      y: 50 + Math.sin(angle) * 30,
    };
  });
  return `<div class="fac-network">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="fac-network__hub-glow" cx="50" cy="50" r="21"/>
      <circle class="fac-network__hub" cx="50" cy="50" r="8"/>
      ${nodes.map((n) =>
    `<line class="fac-network__line fac-network__line--${n.tone}" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`,
  ).join('')}
      ${nodes.map((n) =>
    `<circle class="fac-network__node fac-network__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.6"/>`,
  ).join('')}
    </svg>
    <div class="fac-network__labels">${nodes.map((n) =>
    `<span class="fac-node-label fac-node-label--${n.tone}">
      <i class="ti ${n.icon}"></i><b>${n.code}</b><em></em>
    </span>`,
  ).join('')}</div>
  </div>`;
}

function loadMatrix(bars = []) {
  const cells = bars.map((bar) => {
    const active = Math.max(1, Math.round(bar.value / 2));
    return `<div class="fac-load__col">
      ${Array.from({ length: 5 }, (_, i) => {
    const on = i >= 5 - active;
    const tone = !on ? 'idle' : bar.value >= 9 ? 'hot' : bar.value >= 7 ? 'warn' : 'ok';
    return `<i class="fac-load-cell fac-load-cell--${tone}"></i>`;
  }).join('')}
      <span>${bar.time}</span>
    </div>`;
  }).join('');
  return `<div class="fac-load">${cells}</div>`;
}

function facilityModeDiagram(mode = 'monitor') {
  if (mode === 'roof') return roofStatusDiagram();
  return monitorStatusDiagram();
}

function monitorStatusDiagram() {
  const nodes = [
    { label: 'HVAC', icon: 'ti-air-conditioning', value: '92%', tone: 'warn' },
    { label: 'Đèn', icon: 'ti-bulb', value: 'OK', tone: 'ok' },
    { label: 'UPS', icon: 'ti-bolt', value: '61%', tone: 'ok' },
    { label: 'Thang', icon: 'ti-elevator', value: '14/16', tone: 'warn' },
  ];
  return `<div class="fac-mode-diagram fac-mode-diagram--monitor">
    <div class="fac-mode-diagram__core">
      <i class="ti ti-building-factory-2"></i><strong>BMS</strong><span>24/24 node</span>
    </div>
    <div class="fac-mode-diagram__nodes">${nodes.map((node) =>
    `<span class="fac-mode-node fac-mode-node--${node.tone}">
      <i class="ti ${node.icon}"></i><b>${node.value}</b><em>${node.label}</em>
    </span>`,
  ).join('')}</div>
  </div>`;
}

function roofStatusDiagram() {
  const locks = [
    { label: 'Gió', value: 'OK', tone: 'ok' },
    { label: 'Motor', value: 'Ổn định', tone: 'ok' },
    { label: 'Khóa cơ', value: 'Ready', tone: 'ok' },
  ];
  return `<div class="fac-mode-diagram fac-mode-diagram--roof">
    <div class="fac-roof-viz" aria-hidden="true">
      <span class="fac-roof-viz__base"></span>
      <span class="fac-roof-viz__shell fac-roof-viz__shell--left"></span>
      <span class="fac-roof-viz__shell fac-roof-viz__shell--right"></span>
      <span class="fac-roof-viz__gap"></span>
    </div>
    <div class="fac-roof-stats">${locks.map((item) =>
    `<span class="fac-roof-stat fac-roof-stat--${item.tone}">
      <b>${item.value}</b><em>${item.label}</em>
    </span>`,
  ).join('')}</div>
  </div>`;
}

function infraTrendActions() {
  const points = [46, 52, 58, 66, 62, 74, 69];
  const polyline = points.map((y, index) => `${8 + index * 15},${76 - y}`).join(' ');
  return `<div class="fac-trend-actions">
    <svg class="fac-trend-line" viewBox="0 0 100 56" aria-hidden="true">
      <g class="fac-trend-line__grid">
        <line x1="6" y1="12" x2="96" y2="12"/><line x1="6" y1="30" x2="96" y2="30"/><line x1="6" y1="48" x2="96" y2="48"/>
      </g>
      <polyline points="${polyline}"/>
      ${points.map((y, index) => `<circle cx="${8 + index * 15}" cy="${76 - y}" r="2.2"/>`).join('')}
    </svg>
    <div class="fac-action-row">
      <button type="button" data-fac-action="hvac"><i class="ti ti-air-conditioning"></i><span>Tăng HVAC-B</span></button>
      <button type="button" data-fac-action="ups"><i class="ti ti-bolt"></i><span>Chuyển UPS</span></button>
      <button type="button" data-fac-action="lighting"><i class="ti ti-bulb"></i><span>Giảm tải đèn</span></button>
    </div>
  </div>`;
}

function sensorBars() {
  const sensors = [
    { label: 'HVAC', value: 76, tone: 'cyan' },
    { label: 'UPS', value: 58, tone: 'blue' },
    { label: 'Đèn', value: 88, tone: 'cyan' },
    { label: 'Thang', value: 64, tone: 'blue' },
  ];
  return `<div class="fac-sensor-bars">
    <div class="fac-sensor-bars__labels">${sensors.map((s) => `<span>${s.label}</span>`).join('')}</div>
    <div class="fac-sensor-bars__chart">${sensors.map((s) =>
    `<div class="fac-sensor-bar fac-sensor-bar--${s.tone}">
      <i style="height:${s.value}%"></i><b>${s.value}%</b>
    </div>`,
  ).join('')}</div>
  </div>`;
}

function statusRail(alerts = []) {
  const icons = ['ti-air-conditioning', 'ti-building-arch', 'ti-tool'];
  const levels = [92, 100, 68];
  const actions = ['alertHvac', 'alertRoof', 'alertMaintenance'];
  return `<div class="fac-status-rail">${alerts.map((alert, index) =>
    `<button type="button" class="fac-status fac-status--${index === 0 ? 'warn' : index === 1 ? 'info' : 'ok'}" data-fac-action="${actions[index] || 'bms'}" aria-label="Xử lý ${alert.title}">
      <i class="ti ${icons[index] || 'ti-alert-triangle'}"></i>
      <strong>${index === 0 ? '92%' : index === 1 ? '100%' : 'OK'}</strong>
      <b><span style="width:${levels[index] || 72}%"></span></b>
      <span>${alert.time}</span>
    </button>`,
  ).join('')}</div>`;
}

export function renderFacilitiesLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.env.title)}${thermalMap(d.env.groups)}</section>
    <section class="hud-block">${hudHead('Tải hạ tầng 24h')}${infraTrendActions()}${facilityActionModal()}</section>
    <section class="hud-block">${hudHead(d.systems.title)}${networkDiagram(d.systems.feeds)}</section>
    <div class="hud-tabs hud-tabs--dual" data-fac-mode-tabs>
      <button class="hud-tab hud-tab--active" type="button" data-fac-mode="monitor">${d.modeTabs[0]}</button>
      <button class="hud-tab" type="button" data-fac-mode="roof">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block hud-block--fac-mode" data-fac-mode-panel>${facilityModeDiagram('monitor')}</section>
    <section class="hud-block">${hudHead(d.loadBars.title)}${loadMatrix(d.loadBars.bars)}</section>`;
}

export function renderFacilitiesRight(d) {
  const bars = `
    <div class="hud-bar-item"><div class="hud-bar-head"><span>Tiến trình</span><strong data-roof-pct>0%</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" data-roof-bar style="width:0%"></div></div></div>
    <div class="hud-inline-stat"><i class="ti ti-building-arch"></i><span>Trạng thái</span><strong data-roof-status>Đã đóng</strong></div>`;
  const html = `
    <section class="hud-block">${hudHead('Cảnh báo hạ tầng')}${statusRail(d.alerts)}</section>
    <section class="hud-block">${hudHead('Tải thiết bị BMS')}${sensorBars()}</section>
    <section class="hud-block hud-block--roof">${hudHead(d.roofCtrl.title)}
      <div class="hud-env-row">${ringSvg(100, 'Mái mở')}<div class="hud-env-bars">${bars}</div></div>
      <div class="hud-vent-row">
        <button class="hud-vent-btn" data-roof="open">Mở mái</button>
        <button class="hud-vent-btn" data-roof="close">Đóng mái</button>
        <button class="hud-vent-btn hud-vent-btn--danger" data-roof="stop">Dừng khẩn cấp</button>
      </div>
    </section>`;
  requestAnimationFrame(() => {
    const root = document.querySelector('#page-facilities [data-mount="sidebar-right"]');
    if (root) bindRoofControls(root);
  });
  return html;
}

document.addEventListener('click', (event) => {
  const activeModal = document.querySelector('[data-fac-action-modal]:not([hidden])');
  if (!activeModal) return;
  if (event.target.closest('[data-fac-action-close]') || event.target === activeModal) {
    activeModal.hidden = true;
    return;
  }
  if (event.target.closest('[data-fac-action-confirm]')) {
    activeModal.querySelector('[data-fac-action-status]').textContent = activeModal.dataset.doneStatus;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const activeModal = document.querySelector('[data-fac-action-modal]:not([hidden])');
  if (activeModal) activeModal.hidden = true;
});
