import { hudHead, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import { distributionChart, distributionMinis, distributionStack, radial3dChart } from './radial3d-chart.js';
import {
  renderDispatchPanel, renderDispatchDialog, MEDICAL_DISPATCH, SECURITY_DISPATCH,
} from './emergency-dispatch.js';

function eventRadarChart(values, labels) {
  const cx = 56;
  const cy = 52;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, 42 * v)).join(' ');
  return `<svg class="event-radar3d" viewBox="0 0 112 108" aria-hidden="true">
    <defs><linearGradient id="eventRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="event-radar3d__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(29)}"/><polygon points="${ring(42)}"/>
      ${labels.map((label, i) => {
    const [x, y] = point(i, 50).split(',');
    const [ax, ay] = point(i, 42).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"/><text x="${x}" y="${y}">${label}</text>`;
  }).join('')}
    </g>
    <polygon class="event-radar3d__shadow" points="${data}"/>
    <polygon class="event-radar3d__shape" points="${data}"/>
  </svg>`;
}

function eventLineDonutCombo(bars, centerValue) {
  const max = Math.max(...bars.map((b) => b.value));
  const points = bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `${x},${y}`;
  }).join(' ');
  const pct = Math.max(0, Math.min(100, Number.parseInt(centerValue, 10) || 0));
  const groups = [
    { label: 'Vào', value: pct },
    { label: 'Còn lại', value: Math.max(100 - pct, 1) },
    { label: 'Dự phòng', value: 18 },
  ];
  const flowTotal = groups.reduce((sum, g) => sum + g.value, 0);
  return `<div class="overview-combo-wrap">
    <div class="overview-combo-row">
      <svg class="overview-combo event-combo" viewBox="0 0 88 72" aria-hidden="true">
        <g class="overview-combo__grid">
          ${[14, 24, 34, 44, 54].map((y) => `<line x1="4" y1="${y}" x2="82" y2="${y}"/>`).join('')}
          ${bars.map((b, i) => `<text x="${8 + i * 12}" y="68" text-anchor="middle">${b.time}</text>`).join('')}
        </g>
        <polyline class="overview-combo__line event-combo__line" points="${points}"/>
        ${bars.map((b, i) => {
    const x = 8 + i * 12;
    const y = 52 - (b.value / max) * 38;
    return `<circle class="overview-combo__dot event-combo__dot" cx="${x}" cy="${y}" r="1.8"/>`;
  }).join('')}
      </svg>
      ${distributionChart(flowTotal, groups, { idSuffix: 'EvtAttend' })}
    </div>
  </div>`;
}

function paGroups(view) {
  return [
    { label: view.ringLabel, value: view.ringPct },
    { label: 'Kênh A', value: view.metrics[0]?.pct || 0 },
    { label: 'Kênh B', value: view.metrics[1]?.pct || 0 },
    { label: 'Chờ', value: Math.max(100 - view.ringPct, 1) },
  ];
}

function renderPaStatus(items = []) {
  return `<div class="hud-pa-status">${items.map((item) =>
    `<div class="hud-pa-status__item">
      <i class="ti ${item.icon}"></i><span>${item.label}</span><strong>${item.value}</strong>
    </div>`,
  ).join('')}</div>`;
}

function paDistributionPanel(view, key) {
  const groups = paGroups(view);
  const total = groups.reduce((sum, g) => sum + g.value, 0);
  const groupTotal = total || 1;
  return `<div class="hud-pa-viz">
    <div class="hud-pa-viz__main">
      <div class="hud-pa-viz__top">
        ${radial3dChart(groups, { idSuffix: `EvtPa-${key}` })}
        <strong>${total.toLocaleString('vi-VN')}</strong>
      </div>
      <div class="hud-pa-viz__side">
        <div class="hud-env-bars">${renderMetricBars(view.metrics)}</div>
        ${renderPaStatus(view.status)}
      </div>
    </div>
    ${distributionStack(groups, groupTotal)}
    ${distributionMinis(groups)}
  </div>`;
}

function sectorRow(s) {
  return `<div class="hud-crowd-sector hud-crowd-sector--${s.tone}">
    <div class="hud-crowd-sector__track">
      <div class="hud-crowd-sector__fill" style="width:${s.pct}%"></div>
      <div class="hud-crowd-sector__content">
        <span class="hud-crowd-sector__lbl">${s.label}</span>
        <span class="hud-crowd-sector__pct">${s.pct}%</span>
      </div>
    </div>
  </div>`;
}

function renderAttendanceView(view) {
  return `
    <section class="hud-block">${hudHead(view.title)}
      <div class="hud-inline-stat hud-inline-stat--${view.tone}">
        <i class="ti ti-users"></i><span>${view.label}</span><strong>${view.value}</strong>
      </div>
    </section>
    <section class="hud-block">${hudHead(view.barsTitle)}
      ${eventLineDonutCombo(view.bars, view.value)}
    </section>`;
}

function evacuationRoutePanel() {
  return `<section class="hud-block event-route">
    ${hudHead('Lối thoát dẫm đạp')}
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
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở B2/C1</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-arrow-guide"></i><span>Đảo luồng</span>
      </button>
      <button type="button" class="event-risk__btn">
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
  return `<section class="hud-block event-fire-trend">
    ${hudHead('Cảm biến cháy nổ')}
    <div class="event-fire-bars">${bars.map((b) =>
    `<div class="event-fire-bar event-fire-bar--${b.value > 70 ? 'hot' : b.value > 45 ? 'warn' : 'ok'}">
      <span>${b.label}</span><div class="event-fire-bar__track"><i style="height:${b.value}%"></i></div><b>${b.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-dispatch-open="medical" data-dispatch-type-preset="fire">
        <i class="ti ti-flame"></i><span>Báo cháy</span>
      </button>
      <button type="button" class="event-risk__btn" data-fire-action="smoke">
        <i class="ti ti-wind"></i><span>Hút khói</span>
      </button>
      <button type="button" class="event-risk__btn" data-fire-action="power">
        <i class="ti ti-power"></i><span>Cắt điện</span>
      </button>
    </div>
  </section>`;
}

export function renderEventsLeft(d) {
  return `
    ${overloadPressurePanel(d.crowd)}
    ${evacuationRoutePanel()}
    ${fireSensorTrendPanel()}`;
}

function overloadPressurePanel(crowd) {
  const sectors = crowd.sectors.map((s, i) => ({
    label: s.label.replace('Khán đài ', '').replace('KhÃ¡n Ä‘Ã i ', ''),
    value: s.pct,
    tone: i === 1 ? 'hot' : s.pct >= 88 ? 'warn' : 'ok',
  }));
  return `<section class="hud-block event-overload">
    ${hudHead('Quá tải & dẫm đạp')}
    <div class="event-overload__main">
      ${eventRadarChart([0.86, 0.92, 0.74, 0.68, 0.81, 0.58], ['B12', 'DEN', 'FLOW', 'EXIT', 'PA', 'SEC'])}
      <div class="event-overload__meter">
        <strong>92%</strong>
        <span>Điểm nóng B12</span>
      </div>
    </div>
    <div class="event-overload__lanes">${sectors.map((s) =>
    `<div class="event-overload__lane event-overload__lane--${s.tone}">
      <span>${s.label}</span><i style="width:${s.value}%"></i><b>${s.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="security" data-dispatch-type-preset="crowd">
        <i class="ti ti-shield-exclamation"></i><span>Báo an ninh</span>
      </button>
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở lối thoát</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-arrows-split"></i><span>Chia luồng</span>
      </button>
    </div>
  </section>`;
}

function stampedePanel(stampede) {
  if (!stampede?.active) return '';
  return `${renderDispatchPanel({
    id: 'security',
    title: hudHead('Báo an ninh — Dẫm đạp'),
    buttonLabel: 'Báo an ninh & gửi báo cáo',
    buttonClass: 'hud-emergency__call--security',
    metaLines: [
      '<i class="ti ti-alert-triangle"></i> ' + stampede.zone + ' — ' + stampede.pct + '%',
      '<i class="ti ti-shield"></i> An ninh: 113 / VOC-21',
      '<i class="ti ti-door-exit"></i> Sơ tán: VOC-22 — PA khẩn',
    ],
  })}`;
}

function stampedeDetailPanel(stampede) {
  const cells = Array.from({ length: 24 }, (_, i) => {
    const hot = [6, 7, 11, 12, 13].includes(i);
    const warn = [2, 5, 8, 10, 14, 17, 18].includes(i);
    const exit = [0, 4, 19, 23].includes(i);
    const cls = exit ? 'exit' : hot ? 'hot' : warn ? 'warn' : 'ok';
    const label = exit ? 'EXIT' : hot ? 'B12' : warn ? 'DENSE' : '';
    return `<span class="event-risk-cell event-risk-cell--${cls}">${label}</span>`;
  }).join('');
  return `<section class="hud-block event-risk event-risk--stampede">
    ${hudHead('Dẫm đạp / quá tải')}
    <div class="event-risk__radar">${eventRadarChart([0.92, 0.78, 0.64, 0.86, 0.58, 0.72], ['DEN', 'GATE', 'FLOW', 'B12', 'PA', 'EXIT'])}</div>
    <div class="event-risk__map">
      <div class="event-risk__pitch">SÂN</div>
      <div class="event-risk__grid">${cells}</div>
    </div>
    <div class="event-risk__kpis">
      <span><b>${stampede?.pct || 0}%</b><em>Mật độ B12</em></span>
      <span><b>02</b><em>Cổng phụ mở</em></span>
      <span><b>04'</b><em>ETA sơ tán</em></span>
    </div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="security" data-dispatch-type-preset="crowd">
        <i class="ti ti-shield-exclamation"></i><span>Báo an ninh</span>
      </button>
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở lối thoát</span>
      </button>
      <button type="button" class="event-risk__btn">
        <i class="ti ti-volume"></i><span>PA phân luồng</span>
      </button>
    </div>
  </section>`;
}

function fireRiskPanel() {
  const sensors = [
    { label: 'F&B Bếp B', temp: '68°C', smoke: '42%', tone: 'hot' },
    { label: 'Kho LED', temp: '41°C', smoke: '18%', tone: 'warn' },
    { label: 'Máy phát', temp: '54°C', smoke: '25%', tone: 'warn' },
    { label: 'VIP pantry', temp: '31°C', smoke: '4%', tone: 'ok' },
  ];
  const cells = Array.from({ length: 20 }, (_, i) => {
    const hot = [6, 7, 11].includes(i);
    const warn = [2, 5, 10, 12, 16].includes(i);
    const cls = hot ? 'hot' : warn ? 'warn' : 'ok';
    return `<span class="event-fire-cell event-fire-cell--${cls}"></span>`;
  }).join('');
  const fireGroups = [
    { label: 'Nhiệt', value: 68 },
    { label: 'Khói', value: 42 },
    { label: 'Gas', value: 18 },
    { label: 'Điện', value: 54 },
  ];
  return `<section class="hud-block event-risk event-risk--fire">
    ${hudHead('Nguy cơ cháy nổ')}
    <div class="event-fire-layout">
      <div class="event-fire-radial">
        ${radial3dChart(fireGroups, { idSuffix: 'EvtFireRisk' })}
        <strong>F&B B</strong>
      </div>
      <div class="event-fire-core">
        <i class="ti ti-flame"></i>
        <strong>F&B B</strong>
        <span>khói + nhiệt tăng</span>
      </div>
      <div class="event-fire-matrix">${cells}</div>
    </div>
    <div class="event-fire-sensors">${sensors.map((s) =>
    `<div class="event-fire-sensor event-fire-sensor--${s.tone}">
      <span>${s.label}</span><b>${s.temp}</b><em>${s.smoke}</em>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-dispatch-open="medical" data-dispatch-type-preset="fire">
        <i class="ti ti-flame"></i><span>Gọi cứu hỏa</span>
      </button>
      <button type="button" class="event-risk__btn" data-fire-action="power-zone-b">
        <i class="ti ti-power"></i><span>Cắt điện khu B</span>
      </button>
      <button type="button" class="event-risk__btn" data-fire-action="smoke">
        <i class="ti ti-wind"></i><span>Mở hút khói</span>
      </button>
    </div>
  </section>`;
}

function renderMetricBars(metrics) {
  return metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
}

function renderPaPanel(d, key) {
  const view = d.pa.views[key] || d.pa.views.pa;
  const tabs = d.pa.tabs.map((t, i) => {
    const value = i === 0 ? 'pa' : 'led';
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-events-pa="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  return `${hudHead(d.pa.title)}<div class="hud-tabs" data-events-pa-tabs>${tabs}</div>
    ${paDistributionPanel(view, key)}`;
}

const EVENT_ACTIONS = {
  split: {
    tag: 'FLOW OPS',
    title: 'Chia luồng khán giả',
    icon: 'ti-arrows-split',
    summary: 'Kích hoạt phân luồng từ B12 sang B2/C1, giảm áp lực điểm nóng trong 4 phút.',
    steps: ['Mở barrier mềm B2', 'Điều 2 tổ an ninh', 'Theo dõi heatmap B12'],
    primary: 'Kích hoạt chia luồng',
  },
  reverse: {
    tag: 'ROUTE OPS',
    title: 'Đảo luồng B12',
    icon: 'ti-arrow-guide',
    summary: 'Đảo chiều luồng phụ, ưu tiên thoát qua C1 và khóa nhánh quay lại B12.',
    steps: ['Đảo biển chỉ dẫn', 'Chặn nhánh B12', 'Giữ hành lang C1 thông thoáng'],
    primary: 'Kích hoạt đảo luồng',
  },
  paGuide: {
    tag: 'PA LIVE',
    title: 'PA hướng dẫn thoát tuyến',
    icon: 'ti-speakerphone',
    summary: 'Phát thông báo hướng dẫn khán giả rời khu B12 theo tuyến B2/C1.',
    steps: ['Kênh PA khán đài B', 'Lặp 3 lần / 45 giây', 'Đồng bộ màn LED cổng'],
    primary: 'Phát PA hướng dẫn',
  },
  paSplit: {
    tag: 'PA FLOW',
    title: 'PA phân luồng đám đông',
    icon: 'ti-volume',
    summary: 'Phát kịch bản phân luồng ngắn, ưu tiên trấn an và chia đều khán giả sang hai cửa.',
    steps: ['Giọng đọc khẩn cấp', 'Chỉ hướng B2/C1', 'Nhắc không dừng tại lối hẹp'],
    primary: 'Phát PA phân luồng',
  },
};

function eventActionModal() {
  return `<div class="event-action-modal" data-event-action-modal hidden>
    <div class="event-action-modal__panel" role="dialog" aria-modal="true" aria-label="Điều phối sự kiện">
      <button type="button" class="event-action-modal__close" data-event-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-arrows-split" data-event-action-icon></i></span>
        <div><small data-event-action-tag>FLOW OPS</small><h3 data-event-action-title>Chia luồng khán giả</h3></div>
      </div>
      <p data-event-action-summary></p>
      <div class="event-action-modal__route">
        <span>B12</span><i></i><span>B2</span><i></i><span>C1</span>
      </div>
      <div class="event-action-modal__steps" data-event-action-steps></div>
      <div class="event-action-modal__status"><i class="ti ti-broadcast"></i><span data-event-action-status>Chờ xác nhận điều phối.</span></div>
      <button type="button" class="event-action-modal__primary" data-event-action-confirm>
        <i class="ti ti-send"></i><span data-event-action-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

const FIRE_POWER_ZONES = ['Khán đài A', 'Khán đài B', 'F&B', 'VIP', 'LED', 'PA', 'Cổng B2', 'Cổng C1'];

const fireSystemController = {
  powerOn: true,
  smokePct: 0,
  powerZones: FIRE_POWER_ZONES.map((name) => ({ name, on: true })),
  emit(type, detail) {
    document.dispatchEvent(new CustomEvent('stadium-fire-system-command', { detail: { type, ...detail } }));
  },
};

function fireControlModals() {
  const zoneItems = FIRE_POWER_ZONES.map((name) =>
    `<button type="button" class="event-power-zone event-power-zone--on" data-power-zone="${name}"><i></i><b>${name}</b></button>`,
  ).join('');
  return `<div class="event-smoke-modal" data-smoke-modal hidden>
    <div class="event-smoke-modal__panel" role="dialog" aria-modal="true" aria-label="Hút khói">
      <button type="button" class="event-action-modal__close" data-smoke-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-wind"></i></span>
        <div><small>SMOKE EXTRACT</small><h3>Hút khói khu nguy cơ</h3></div>
      </div>
      <div class="event-smoke-gauge">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r="52"></circle>
          <circle data-smoke-ring cx="70" cy="70" r="52"></circle>
        </svg>
        <strong><span data-smoke-pct>0</span>%</strong>
      </div>
      <p data-smoke-status>Đang khởi động quạt hút khói và mở tuyến thoát khí.</p>
      <div class="event-action-modal__steps">
        <span><b>01</b>F&B B hút khói</span><span><b>02</b>Áp âm hành lang</span><span><b>03</b>Theo dõi cảm biến</span>
      </div>
    </div>
  </div>
  <div class="event-power-modal" data-power-modal hidden>
    <div class="event-power-modal__panel" role="dialog" aria-modal="true" aria-label="Cắt điện sân vận động">
      <button type="button" class="event-action-modal__close" data-power-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-power-button" data-power-toggle><i class="ti ti-power"></i></span>
        <div><small data-power-tag>POWER CONTROL</small><h3 data-power-title>Cắt điện toàn bộ SVĐ</h3></div>
      </div>
      <p data-power-message>Điều này sẽ cắt điện hoàn toàn hệ thống sân vận động. Bạn có chắc chắn muốn tiếp tục?</p>
      <div class="event-power-zones">${zoneItems}</div>
      <div class="event-action-modal__status"><i class="ti ti-bolt"></i><span data-power-status>Chờ xác nhận thao tác nguồn.</span></div>
      <div class="event-power-confirm" data-power-confirm hidden>
        <button type="button" class="event-power-confirm__no" data-power-cancel>Không</button>
        <button type="button" class="event-power-confirm__yes" data-power-accept>Có, cắt điện</button>
      </div>
    </div>
  </div>`;
}

export function renderEventsRight(d) {
  return `
    ${stampedeDetailPanel(d.stampede)}
    ${fireRiskPanel()}
    ${eventActionModal()}
    ${fireControlModals()}
    ${renderDispatchDialog(SECURITY_DISPATCH)}
    ${renderDispatchDialog(MEDICAL_DISPATCH)}`;

  const stats = d.ops.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Cảnh báo vận hành')}
      ${eventRadarChart([0.92, 0.76, 0.58, 0.84, 0.68, 0.48], ['DEN', 'PA', 'LED', 'F&B', 'SEC', 'VIP'])}
      ${renderAlerts(d.alerts)}
    </section>
    ${stampedePanel(d.stampede)}
    <section class="hud-block" data-events-pa-panel>${renderPaPanel(d, 'pa')}</section>
    <section class="hud-block">${hudHead(d.timeline.title)}
      <div class="hud-device-status">Mốc: <span class="hud-badge">${d.timeline.status}</span></div>
      <div class="hud-vent-row">${d.timeline.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.ops.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.ops.chart, 'evtGrad')}
    </section>
    ${d.stampede?.active ? renderDispatchDialog(SECURITY_DISPATCH) : ''}`;
}

export function bindEventsHudTabs(root, data) {
  root.querySelector('[data-events-attendance-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-events-attendance]');
    if (!tab) return;
    const panel = root.querySelector('[data-events-attendance-panel]');
    const view = data.left.attendanceViews[tab.dataset.eventsAttendance];
    if (panel && view) panel.innerHTML = renderAttendanceView(view);
  });

  root.querySelector('[data-events-pa-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-events-pa]');
    if (!tab) return;
    const panel = root.querySelector('[data-events-pa-panel]');
    if (panel) panel.innerHTML = renderPaPanel(data.right, tab.dataset.eventsPa);
  });

  const modal = root.querySelector('[data-event-action-modal]');
  const fillAction = (action) => {
    if (!modal || !action) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.querySelector('[data-event-action-icon]').className = `ti ${action.icon}`;
    modal.querySelector('[data-event-action-tag]').textContent = action.tag;
    modal.querySelector('[data-event-action-title]').textContent = action.title;
    modal.querySelector('[data-event-action-summary]').textContent = action.summary;
    modal.querySelector('[data-event-action-primary]').textContent = action.primary;
    modal.querySelector('[data-event-action-status]').textContent = 'Chờ xác nhận điều phối.';
    modal.querySelector('[data-event-action-steps]').innerHTML = action.steps
      .map((step, i) => `<span><b>${String(i + 1).padStart(2, '0')}</b>${step}</span>`)
      .join('');
    modal.hidden = false;
  };

  root.addEventListener('click', (event) => {
    const btn = event.target.closest('.event-risk__btn');
    if (!btn || btn.dataset.dispatchOpen) return;
    const icon = btn.querySelector('.ti');
    const cls = icon?.className || '';
    if (cls.includes('ti-arrows-split')) fillAction(EVENT_ACTIONS.split);
    else if (cls.includes('ti-arrow-guide')) fillAction(EVENT_ACTIONS.reverse);
    else if (cls.includes('ti-speakerphone')) fillAction(EVENT_ACTIONS.paGuide);
    else if (cls.includes('ti-volume')) fillAction(EVENT_ACTIONS.paSplit);
  });

  document.addEventListener('click', (event) => {
    const activeModal = document.querySelector('[data-event-action-modal]:not([hidden])');
    if (!activeModal) return;
    if (event.target.closest('[data-event-action-close]') || event.target === activeModal) {
      activeModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-event-action-confirm]')) {
      activeModal.querySelector('[data-event-action-status]').textContent = 'Đã gửi lệnh điều phối tới PA, an ninh và đội cổng.';
    }
  });

  const smokeModal = root.querySelector('[data-smoke-modal]');
  const powerModal = root.querySelector('[data-power-modal]');
  let smokeTimer = null;
  let powerTimer = null;

  const showModal = (modal) => {
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.hidden = false;
  };

  const setSmokePct = (pct) => {
    fireSystemController.smokePct = Math.max(0, Math.min(100, pct));
    const pctNode = smokeModal?.querySelector('[data-smoke-pct]');
    const ring = smokeModal?.querySelector('[data-smoke-ring]');
    const status = smokeModal?.querySelector('[data-smoke-status]');
    if (pctNode) pctNode.textContent = String(Math.round(fireSystemController.smokePct));
    if (ring) {
      const circumference = 327;
      ring.style.strokeDashoffset = String(circumference * (1 - fireSystemController.smokePct / 100));
    }
    if (status) {
      status.textContent = fireSystemController.smokePct >= 100
        ? 'Đã hút khói xong. Cảm biến khói về ngưỡng an toàn.'
        : 'Đang hút khói, quạt áp lực và cảm biến khói đang cập nhật theo thời gian thực.';
    }
  };

  const startSmokeExtraction = () => {
    showModal(smokeModal);
    if (smokeTimer) clearInterval(smokeTimer);
    setSmokePct(0);
    fireSystemController.emit('smoke-extract-start', { zone: 'F&B B' });
    smokeTimer = setInterval(() => {
      const next = fireSystemController.smokePct + 4 + Math.random() * 7;
      setSmokePct(next);
      if (fireSystemController.smokePct >= 100) {
        clearInterval(smokeTimer);
        smokeTimer = null;
        fireSystemController.emit('smoke-extract-complete', { zone: 'F&B B' });
      }
    }, 220);
  };

  const renderPowerZones = () => {
    powerModal?.querySelectorAll('[data-power-zone]').forEach((node) => {
      const zone = fireSystemController.powerZones.find((item) => item.name === node.dataset.powerZone);
      const selected = powerModal?.dataset.powerZone === node.dataset.powerZone;
      node.classList.toggle('event-power-zone--on', !!zone?.on);
      node.classList.toggle('event-power-zone--off', !zone?.on);
      node.classList.toggle('event-power-zone--selected', selected);
      node.setAttribute('aria-pressed', String(selected));
      node.setAttribute('aria-label', `${zone?.name || node.dataset.powerZone} - ${zone?.on ? 'đang có điện' : 'đã cắt điện'}`);
    });
  };

  const preparePowerConfirm = ({ turnOn = false, zoneName = '', showConfirm = true } = {}) => {
    showModal(powerModal);
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
    powerModal.dataset.powerIntent = turnOn ? 'on' : 'off';
    powerModal.querySelector('[data-power-confirm]').hidden = !showConfirm;
    renderPowerZones();
  };

  const runPowerSequence = (turnOn, zoneName = '') => {
    if (powerTimer) clearInterval(powerTimer);
    const status = powerModal.querySelector('[data-power-status]');
    const confirm = powerModal.querySelector('[data-power-confirm]');
    confirm.hidden = true;
    if (!zoneName) {
      if (status) status.textContent = turnOn ? 'Đang mở điện từng khu...' : 'Đang cắt điện từng khu...';
      fireSystemController.emit(turnOn ? 'power-restore-start' : 'power-cut-start', {
        zones: fireSystemController.powerZones.map((z) => z.name),
      });
      const order = [...fireSystemController.powerZones.keys()].sort(() => Math.random() - 0.5);
      let index = 0;
      powerTimer = setInterval(() => {
        const zoneIndex = order[index];
        if (zoneIndex != null) fireSystemController.powerZones[zoneIndex].on = turnOn;
        const zoneName = fireSystemController.powerZones[zoneIndex]?.name;
        renderPowerZones();
        if (status && zoneName) {
          status.textContent = turnOn ? `Đang mở điện lại ${zoneName}...` : `Đang cắt điện ${zoneName}...`;
        }
        index += 1;
        if (index >= order.length) {
          clearInterval(powerTimer);
          powerTimer = null;
          fireSystemController.powerOn = turnOn;
          if (status) status.textContent = turnOn
            ? 'Đã mở điện lại toàn bộ hệ thống SVĐ.'
            : 'Đã cắt điện toàn bộ hệ thống SVĐ. Nhấn nút nguồn để mở lại.';
          fireSystemController.emit(turnOn ? 'power-restore-complete' : 'power-cut-complete', {
            zones: fireSystemController.powerZones.map((z) => ({ ...z })),
          });
        }
      }, 260);
      return;
    }

    const zone = fireSystemController.powerZones.find((item) => item.name === zoneName);
    if (!zone) {
      if (status) status.textContent = 'Vui lòng chọn một khu vực trước khi xác nhận.';
      return;
    }
    const zoneNode = [...powerModal.querySelectorAll('[data-power-zone]')]
      .find((node) => node.dataset.powerZone === zoneName);
    if (status) status.textContent = turnOn ? `Đang mở điện lại ${zoneName}...` : `Đang cắt điện ${zoneName}...`;
    fireSystemController.emit(turnOn ? 'power-restore-start' : 'power-cut-start', { zones: [zoneName] });
    zone.on = turnOn;
    fireSystemController.powerOn = fireSystemController.powerZones.some((item) => item.on);
    renderPowerZones();
    zoneNode?.classList.toggle('event-power-zone--on', turnOn);
    zoneNode?.classList.toggle('event-power-zone--off', !turnOn);
    powerTimer = setTimeout(() => {
      powerTimer = null;
      if (status) status.textContent = turnOn
        ? `Đã mở điện lại ${zoneName}.`
        : `Đã cắt điện ${zoneName}. Các khu vực khác vẫn giữ trạng thái hiện tại.`;
      fireSystemController.emit(turnOn ? 'power-restore-complete' : 'power-cut-complete', {
        zones: [{ ...zone }],
      });
    }, 420);
  };

  root.addEventListener('click', (event) => {
    const fireBtn = event.target.closest('[data-fire-action]');
    if (!fireBtn) return;
    if (fireBtn.dataset.fireAction === 'smoke') startSmokeExtraction();
    if (fireBtn.dataset.fireAction === 'power') preparePowerConfirm({ turnOn: false, showConfirm: false });
    if (fireBtn.dataset.fireAction === 'power-zone-b') {
      preparePowerConfirm({ turnOn: false, zoneName: 'Khán đài B', showConfirm: true });
    }
  });

  const handlePowerModalClick = (event) => {
    const activePowerModal = event.currentTarget;
    event.stopPropagation();
    if (event.target.closest('[data-power-close]') || event.target.closest('[data-power-cancel]') || event.target === activePowerModal) {
      activePowerModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-power-toggle]')) {
      preparePowerConfirm({ turnOn: !fireSystemController.powerOn });
      return;
    }
    const zoneNode = event.target.closest('[data-power-zone]');
    if (zoneNode) {
      const zone = fireSystemController.powerZones.find((item) => item.name === zoneNode.dataset.powerZone);
      preparePowerConfirm({ turnOn: !zone?.on, zoneName: zoneNode.dataset.powerZone, showConfirm: true });
      return;
    }
    if (event.target.closest('[data-power-accept]')) {
      runPowerSequence(activePowerModal.dataset.powerIntent === 'on', activePowerModal.dataset.powerZone);
    }
  };

  powerModal?.addEventListener('click', handlePowerModalClick);
  powerModal?.querySelector('[data-power-accept]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    runPowerSequence(powerModal.dataset.powerIntent === 'on', powerModal.dataset.powerZone);
  });
  powerModal?.querySelectorAll('[data-power-zone]').forEach((zoneNode) => {
    zoneNode.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const zone = fireSystemController.powerZones.find((item) => item.name === zoneNode.dataset.powerZone);
      preparePowerConfirm({ turnOn: !zone?.on, zoneName: zoneNode.dataset.powerZone, showConfirm: true });
    });
  });
  powerModal?.querySelector('[data-power-toggle]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    preparePowerConfirm({ turnOn: !fireSystemController.powerOn });
  });

  document.addEventListener('click', (event) => {
    const activeSmokeModal = document.querySelector('[data-smoke-modal]:not([hidden])');
    const activePowerModal = document.querySelector('[data-power-modal]:not([hidden])');
    if (activeSmokeModal && (event.target.closest('[data-smoke-close]') || event.target === activeSmokeModal)) {
      activeSmokeModal.hidden = true;
      if (smokeTimer) clearInterval(smokeTimer);
      smokeTimer = null;
      return;
    }
    if (!activePowerModal) return;
    if (activePowerModal !== powerModal) return;
    if (event.target.closest('[data-power-close]') || event.target.closest('[data-power-cancel]') || event.target === activePowerModal) {
      activePowerModal.hidden = true;
      return;
    }
    if (event.target.closest('[data-power-toggle]')) {
      preparePowerConfirm({ turnOn: !fireSystemController.powerOn });
      return;
    }
    const zoneNode = event.target.closest('[data-power-zone]');
    if (zoneNode) {
      const zone = fireSystemController.powerZones.find((item) => item.name === zoneNode.dataset.powerZone);
      preparePowerConfirm({ turnOn: !zone?.on, zoneName: zoneNode.dataset.powerZone, showConfirm: true });
      return;
    }
    if (event.target.closest('[data-power-accept]')) {
      runPowerSequence(activePowerModal.dataset.powerIntent === 'on', activePowerModal.dataset.powerZone);
    }
  });
}
