import { hudHead, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';
import { distributionChart, distributionMinis, distributionStack, radial3dChart } from './radial3d-chart.js';
import {
  renderDispatchPanel, renderDispatchDialog, MEDICAL_DISPATCH, SECURITY_DISPATCH, openDispatchDialog,
} from './emergency-dispatch.js';
import { addOperationalReport } from '../data/stadium-report-store.js';

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

const CROWD_DENSITY_ZONES = [
  { id: 'A', label: 'Khán đài A', pct: 82, tone: 'warn', note: 'Gần ngưỡng, theo dõi lối lên' },
  { id: 'B12', label: 'Khán đài B12', pct: 92, tone: 'hot', note: 'Cần điều tổ ngay' },
  { id: 'B2', label: 'Cổng B2', pct: 86, tone: 'warn', note: 'Mở thêm luồng thoát' },
  { id: 'C1', label: 'Cổng C1', pct: 78, tone: 'ok', note: 'Sẵn sàng nhận luồng' },
  { id: 'D', label: 'Khán đài D', pct: 84, tone: 'warn', note: 'Gần nguy cấp sau giải lao' },
  { id: 'VIP', label: 'VIP', pct: 66, tone: 'ok', note: 'Ổn định' },
  { id: 'GATE', label: 'Cổng vào', pct: 72, tone: 'ok', note: 'Dòng vào bình thường' },
  { id: 'EXIT', label: 'Lối thoát', pct: 58, tone: 'exit', note: 'Tuyến thoát ưu tiên' },
];

const DENSITY_ACTION_CONTEXT = {
  densityTeam: { focus: ['B12', 'B2', 'D'], plan: 'Điều 2 tổ an ninh tới B12, một tổ giữ B2 và một tổ theo dõi khu D.' },
  densityReduce: { focus: ['B12', 'B2', 'C1'], plan: 'Giảm dòng vào B12, mở tuyến B2/C1 và chuyển khán giả sang khu C1.' },
  heatmap: { focus: ['A', 'B12', 'B2', 'D'], plan: 'Bật lớp bản đồ nhiệt toàn sân, ưu tiên các khu mật độ cao và cận ngưỡng trong 60 giây tới.' },
  heatmapB12: { focus: ['A', 'B12', 'B2', 'D'], plan: 'Bật lớp bản đồ nhiệt toàn sân, ưu tiên các khu mật độ cao và cận ngưỡng trong 60 giây tới.' },
  isolateDense: { focus: ['B12', 'B2'], plan: 'Khoanh vùng các ô đông nhất quanh B12 và giữ hành lang B2 không bị quay đầu.' },
  nearestExit: { focus: ['B12', 'B2', 'C1', 'EXIT'], plan: 'Mở lối thoát gần nhất, dẫn luồng từ B12 qua B2 và C1.' },
  dispatchTeam: { focus: ['B12', 'A', 'D'], plan: 'Gửi đội cơ động gần nhất tới B12, đội dự phòng kiểm tra A/D trong vòng 2 phút.' },
  split: { focus: ['B12', 'B2', 'C1'], plan: 'Chia luồng B12 sang B2/C1, giữ C1 làm tuyến nhận luồng an toàn.' },
  reverse: { focus: ['B12', 'C1', 'EXIT'], plan: 'Đảo chiều luồng phụ, khóa nhánh quay lại B12 và ưu tiên thoát qua C1.' },
  paGuide: { focus: ['B12', 'B2', 'C1'], plan: 'Phát PA hướng dẫn rời khu đông theo hai tuyến B2/C1.' },
  paSplit: { focus: ['B12', 'B2', 'C1'], plan: 'Phát kịch bản PA phân luồng ngắn, chia đều khán giả sang hai cửa.' },
};

const DENSITY_ACTION_UI = {
  densityTeam: {
    variant: 'crew',
    metrics: [['03', 'Tổ sẵn sàng'], ['02\'', 'ETA B12'], ['B12/D', 'Khu ưu tiên']],
    detail: `<div class="event-density-crew">
      <span><b>Alpha-02</b><em>B12 tầng 2</em><strong>Đến ngay</strong></span>
      <span><b>Bravo-01</b><em>Cổng B2</em><strong>Giữ luồng</strong></span>
      <span><b>Delta-03</b><em>Khán đài D</em><strong>Dự phòng</strong></span>
    </div>`,
  },
  densityReduce: {
    variant: 'flow',
    metrics: [['-28%', 'Dòng vào B12'], ['+420', 'Chuyển sang C1'], ['84%', 'Ngưỡng mục tiêu']],
    detail: `<div class="event-density-flow">
      <span><b>B12 vào</b><i style="width:42%"></i><em>-28%</em></span>
      <span><b>B2 thoát</b><i style="width:76%"></i><em>+18%</em></span>
      <span><b>C1 nhận</b><i style="width:68%"></i><em>+420</em></span>
    </div>`,
  },
  heatmap: {
    variant: 'heat',
    metrics: [['01', 'Đỉnh cao'], ['03', 'Cận ngưỡng'], ['60s', 'Refresh']],
    detail: `<div class="event-density-heat">
      <span><b>92%</b><i></i><em>B12 cao</em></span>
      <span><b>86%</b><i></i><em>B2 cận</em></span>
      <span><b>84%</b><i></i><em>D cận</em></span>
      <span><b>82%</b><i></i><em>A cận</em></span>
    </div>`,
  },
  heatmapB12: {
    variant: 'heat',
    metrics: [['01', 'Đỉnh cao'], ['03', 'Cận ngưỡng'], ['60s', 'Refresh']],
    detail: `<div class="event-density-heat">
      <span><b>92%</b><i></i><em>B12 cao</em></span>
      <span><b>86%</b><i></i><em>B2 cận</em></span>
      <span><b>84%</b><i></i><em>D cận</em></span>
      <span><b>82%</b><i></i><em>A cận</em></span>
    </div>`,
  },
  isolateDense: {
    variant: 'isolate',
    metrics: [['05', 'Ô cô lập'], ['03', 'Barrier'], ['40m', 'Bán kính']],
    detail: `<div class="event-density-isolate">
      ${['B12-1', 'B12-2', 'B12-3', 'B2-1', 'D-2', 'C1'].map((cell, i) =>
    `<span class="${i < 5 ? 'event-density-isolate__cell--lock' : ''}"><b>${cell}</b><em>${i < 5 ? 'LOCK' : 'OPEN'}</em></span>`).join('')}
    </div>`,
  },
  nearestExit: {
    variant: 'exit',
    metrics: [['02', 'EXIT mở'], ['04\'', 'ETA sơ tán'], ['1.2k', 'Người/phút']],
    detail: `<div class="event-density-exit-route">
      <span>B12</span><i></i><span>B2</span><i></i><span>C1</span><i></i><span>EXIT</span>
    </div>`,
  },
  dispatchTeam: {
    variant: 'dispatch',
    metrics: [['02', 'Đội cơ động'], ['01\'30', 'ETA gần nhất'], ['VOC-21', 'Kênh lệnh']],
    detail: `<div class="event-density-dispatch">
      <span><i class="ti ti-motorbike"></i><b>Đội nhanh 1</b><em>Từ cổng B2 tới B12</em></span>
      <span><i class="ti ti-shield"></i><b>Đội an ninh 4</b><em>Chốt mép khán đài A/D</em></span>
    </div>`,
  },
  split: {
    variant: 'flow',
    metrics: [['2 tuyến', 'B2/C1 nhận'], ['04\'', 'Giảm áp'], ['-18%', 'B12 dự kiến']],
    detail: `<div class="event-density-flow">
      <span><b>B12</b><i style="width:48%"></i><em>giảm</em></span>
      <span><b>B2</b><i style="width:74%"></i><em>nhận</em></span>
      <span><b>C1</b><i style="width:66%"></i><em>nhận</em></span>
    </div>`,
  },
  reverse: {
    variant: 'exit',
    metrics: [['01', 'Luồng đảo'], ['03', 'Chốt khóa'], ['C1', 'Tuyến chính']],
    detail: `<div class="event-density-exit-route">
      <span>B12</span><i></i><span>C1</span><i></i><span>EXIT</span><i></i><span>PA</span>
    </div>`,
  },
  paGuide: {
    variant: 'pa',
    metrics: [['03', 'Lần phát'], ['45s', 'Chu kỳ'], ['B/C', 'Vùng loa']],
    detail: `<div class="event-density-pa">
      <span><b>PA B</b><em>Rời B12 theo hướng B2</em></span>
      <span><b>LED C1</b><em>Hiển thị tuyến nhận luồng</em></span>
      <span><b>PA Gate</b><em>Nhắc không dừng ở lối hẹp</em></span>
    </div>`,
  },
  paSplit: {
    variant: 'pa',
    metrics: [['02', 'Cửa hướng dẫn'], ['03', 'Thông điệp'], ['LIVE', 'PA ưu tiên']],
    detail: `<div class="event-density-pa">
      <span><b>B2</b><em>Đi theo hàng phải</em></span>
      <span><b>C1</b><em>Tuyến nhận khách phụ</em></span>
      <span><b>LED</b><em>Đồng bộ mũi tên luồng</em></span>
    </div>`,
  },
};

function densityToneLabel(tone) {
  if (tone === 'hot') return 'Cần điều ngay';
  if (tone === 'warn') return 'Gần nguy cấp';
  if (tone === 'exit') return 'Lối thoát';
  return 'Ổn định';
}

function densityMapGrid({ compact = false, focus = [] } = {}) {
  const focusSet = new Set(focus);
  const cells = CROWD_DENSITY_ZONES.map((zone) => {
    const active = focusSet.has(zone.id);
    const alert = zone.tone === 'hot' || zone.tone === 'warn';
    return `<button type="button" class="event-density-zone event-density-zone--${zone.tone}${active ? ' event-density-zone--active' : ''}" data-density-zone="${zone.id}">
      <b>${zone.id}</b>
      ${alert ? '<i>!</i>' : ''}
      <span>${compact ? `${zone.pct}%` : zone.label}</span>
    </button>`;
  }).join('');
  return `<div class="event-density-map${compact ? ' event-density-map--compact' : ''}">
    <div class="event-density-map__pitch">SÂN</div>
    <div class="event-density-map__grid">${cells}</div>
  </div>`;
}

function densityMiniPanel() {
  const hot = CROWD_DENSITY_ZONES.find((zone) => zone.tone === 'hot') || CROWD_DENSITY_ZONES[0];
  const warnCount = CROWD_DENSITY_ZONES.filter((zone) => zone.tone === 'warn').length;
  return `<div class="event-density-overview event-density-overview--summary">
    <div class="event-risk__kpis">
      <span><b>${hot.pct}%</b><em>${hot.id} cao</em></span>
      <span><b>${warnCount}</b><em>Điểm cao</em></span>
      <span><b>04'</b><em>ETA</em></span>
    </div>
    <div class="event-density-mini-diagram event-density-mini-diagram--map" aria-label="Bản đồ mật độ hệ thống">
      <svg class="event-density-system-map" viewBox="0 0 240 82" aria-hidden="true">
        <defs>
          <linearGradient id="densityMapBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0a5f95"/>
            <stop offset="100%" stop-color="#18d8f5"/>
          </linearGradient>
          <linearGradient id="densityMapHot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0872a6"/>
            <stop offset="100%" stop-color="#7edfff"/>
          </linearGradient>
        </defs>
        <ellipse class="event-density-system-map__outer" cx="118" cy="40" rx="84" ry="31"/>
        <ellipse class="event-density-system-map__inner" cx="118" cy="40" rx="48" ry="18"/>
        <path class="event-density-system-map__stand event-density-system-map__stand--hot" d="M73 16c21-12 71-12 93 0l-17 15c-18-8-43-8-62 0z"/>
        <path class="event-density-system-map__stand" d="M166 17c19 9 28 23 25 39l-26-9c2-9-2-17-15-25z"/>
        <path class="event-density-system-map__stand" d="M72 17c-19 9-28 23-25 39l26-9c-2-9 2-17 15-25z"/>
        <path class="event-density-system-map__route" d="M84 59C99 70 137 71 154 58"/>
        <path class="event-density-system-map__route event-density-system-map__route--exit" d="M154 58h42"/>
        <circle class="event-density-system-map__node event-density-system-map__node--hot" cx="118" cy="16" r="7"/>
        <circle class="event-density-system-map__node" cx="84" cy="59" r="5"/>
        <circle class="event-density-system-map__node" cx="154" cy="58" r="5"/>
        <circle class="event-density-system-map__node event-density-system-map__node--exit" cx="202" cy="58" r="7"/>
        <text x="118" y="18">B12</text>
        <text x="84" y="72">B2</text>
        <text x="154" y="72">C1</text>
        <text x="202" y="72">RA</text>
      </svg>
    </div>
  </div>`;
}

function densityModalMap(actionKey = 'densityTeam') {
  const context = DENSITY_ACTION_CONTEXT[actionKey] || DENSITY_ACTION_CONTEXT.densityTeam;
  const ui = DENSITY_ACTION_UI[actionKey] || DENSITY_ACTION_UI.densityTeam;
  const legend = [
    ['hot', 'Đỉnh cao', 'Cần điều ngay'],
    ['warn', 'Cận ngưỡng', 'Gần nguy cấp'],
    ['ok', 'Ổn định', 'Trong ngưỡng'],
  ].map(([tone, label, desc]) => `<span class="event-density-legend__item event-density-legend__item--${tone}"><b>${label}</b><em>${desc}</em></span>`).join('');
  const zones = CROWD_DENSITY_ZONES.map((zone) =>
    `<span class="event-density-zone-row event-density-zone-row--${zone.tone}">
      <b>${zone.id}</b><strong>${zone.pct}%</strong><em>${densityToneLabel(zone.tone)}</em>
    </span>`,
  ).join('');
  const metrics = ui.metrics.map(([value, label]) =>
    `<span><b>${value}</b><em>${label}</em></span>`,
  ).join('');
  return `<div class="event-density-modal-map event-density-modal-map--${ui.variant}" data-event-density-map>
    ${densityMapGrid({ focus: context.focus })}
    <div class="event-density-modal-map__side">
      <div class="event-density-action-metrics">${metrics}</div>
      <div class="event-density-action-detail event-density-action-detail--${ui.variant}">${ui.detail}</div>
      <div class="event-density-legend">${legend}</div>
    </div>
    <div class="event-density-zone-list">${zones}</div>
    <div class="event-density-plan" data-event-density-plan>${context.plan}</div>
  </div>`;
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
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn" data-dispatch-open="security" data-dispatch-type-preset="evac">
        <i class="ti ti-door-exit"></i><span>Mở B2/C1</span>
      </button>
      <button type="button" class="event-risk__btn" data-event-action-open="reverse">
        <i class="ti ti-arrow-guide"></i><span>Đảo luồng</span>
      </button>
      <button type="button" class="event-risk__btn" data-event-action-open="paGuide">
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
    <div class="event-fire-auto">
      <button type="button" class="event-fire-auto__button" data-fire-auto-chain aria-label="Kích hoạt dây chuyền chống cháy">
        <i class="ti ti-shield-bolt"></i>
        <span>Auto PCCC</span>
      </button>
      <p data-fire-auto-status>Kích hoạt dây chuyền chống cháy</p>
    </div>
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

function fifaEventReadinessPanel() {
  const routes = [
    { label: 'B12', value: 92, tone: 'hot' },
    { label: 'B2', value: 74, tone: 'warn' },
    { label: 'C1', value: 58, tone: 'ok' },
    { label: 'RA', value: 42, tone: 'ok' },
  ];
  const systems = [
    { label: 'THOÁT', value: 82 },
    { label: 'CHÁY', value: 86 },
    { label: 'PA', value: 100 },
    { label: 'Y TẾ', value: 78 },
    { label: 'ĐIỆN', value: 72 },
  ];
  const cells = Array.from({ length: 30 }, (_, i) => {
    const tone = [3, 7, 11].includes(i) ? 'hot' : [14, 19, 24, 27].includes(i) ? 'warn' : 'ok';
    return `<span class="fifa-event-cell fifa-event-cell--${tone}"></span>`;
  }).join('');
  const total = Math.round(systems.reduce((sum, item) => sum + item.value, 0) / systems.length);
  return `<section class="hud-block hud-block--fifa-event">
    ${hudHead('Năng lực ứng phó')}
    <div class="fifa-event-readiness">
      <div class="fifa-event-score">
        <svg viewBox="0 0 96 96" aria-hidden="true">
          <circle cx="48" cy="48" r="34"></circle>
          <circle cx="48" cy="48" r="34" style="stroke-dashoffset:${214 * (1 - total / 100)}"></circle>
        </svg>
        <strong>${total}%</strong>
      </div>
      <div class="fifa-event-routes">${routes.map((route) => `
        <span class="fifa-event-route fifa-event-route--${route.tone}">
          <b>${route.label}</b><i><em style="width:${route.value}%"></em></i><strong>${route.value}%</strong>
        </span>
      `).join('')}</div>
      <div class="fifa-event-bars">${systems.map((item) => `
        <span><b>${item.label}</b><i style="height:${item.value}%"></i><strong>${item.value}%</strong></span>
      `).join('')}</div>
      <div class="fifa-event-matrix">${cells}</div>
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
    ${hudHead('Quản lý quá tải & dẫm đạp')}
    <div class="event-overload__main">
      ${eventRadarChart([0.86, 0.92, 0.74, 0.68, 0.81, 0.58], ['A', 'B12', 'C1', 'EXIT', 'D', 'B2'])}
      <div class="event-overload__meter">
        <strong>92%</strong>
        <span>Đỉnh mật độ B12</span>
      </div>
    </div>
    <div class="event-overload__lanes">${sectors.map((s) =>
    `<div class="event-overload__lane event-overload__lane--${s.tone}">
      <span>${s.label}</span><i style="width:${s.value}%"></i><b>${s.value}%</b>
    </div>`,
  ).join('')}</div>
    <div class="event-risk__actions">
      <button type="button" class="event-risk__btn event-risk__btn--hot" data-event-action-open="densityTeam">
        <i class="ti ti-users-group"></i><span>Điều tổ</span>
      </button>
      <button type="button" class="event-risk__btn" data-event-action-open="densityReduce">
        <i class="ti ti-arrows-minimize"></i><span>Giảm mật độ</span>
      </button>
      <button type="button" class="event-risk__btn" data-event-action-open="heatmap">
        <i class="ti ti-map-search"></i><span>Bản đồ nhiệt</span>
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
  return `<section class="hud-block event-risk event-risk--stampede">
    ${hudHead('Bản đồ mật độ')}
    ${densityMiniPanel()}
  </section>`;
}

const FIRE_ZONE_DETAILS = {
  fb: {
    label: 'F&B B',
    sensor: 'F&B Bếp B',
    temp: '68°C',
    smoke: '42%',
    tone: 'hot',
    status: 'khói + nhiệt tăng',
    icon: 'ti-flame',
    primary: 'Gọi cứu hỏa',
    power: 'Cắt điện khu B',
    ventilation: 'Mở hút khói',
  },
  led: {
    label: 'Kho LED',
    sensor: 'Kho LED',
    temp: '41°C',
    smoke: '18%',
    tone: 'warn',
    status: 'nhiệt tủ LED tăng',
    icon: 'ti-device-tv',
    primary: 'Cử kỹ thuật LED',
    power: 'Cắt nguồn LED',
    ventilation: 'Tăng thông gió',
  },
  generator: {
    label: 'Máy phát',
    sensor: 'Máy phát',
    temp: '54°C',
    smoke: '25%',
    tone: 'warn',
    status: 'nhiệt máy phát cao',
    icon: 'ti-engine',
    primary: 'Gọi đội điện',
    power: 'Chuyển UPS',
    ventilation: 'Mở cửa gió',
  },
  vip: {
    label: 'VIP pantry',
    sensor: 'VIP pantry',
    temp: '31°C',
    smoke: '4%',
    tone: 'ok',
    status: 'ổn định, theo dõi',
    icon: 'ti-tools-kitchen-2',
    primary: 'Kiểm tra pantry',
    power: 'Giữ nguồn VIP',
    ventilation: 'Theo dõi HVAC',
  },
};

function fireRiskPanel() {
  const sensors = [
    { id: 'fb', ...FIRE_ZONE_DETAILS.fb },
    { id: 'led', ...FIRE_ZONE_DETAILS.led },
    { id: 'generator', ...FIRE_ZONE_DETAILS.generator },
    { id: 'vip', ...FIRE_ZONE_DETAILS.vip },
  ];
  const fireZoneCells = {
    6: { id: 'fb', label: 'F&B B' },
    7: { id: 'led', label: 'Kho LED' },
    11: { id: 'generator', label: 'Máy phát' },
    17: { id: 'vip', label: 'VIP' },
  };
  const cells = Array.from({ length: 20 }, (_, i) => {
    const hot = [6, 7, 11].includes(i);
    const warn = [2, 5, 10, 12, 16].includes(i);
    const cls = hot ? 'hot' : warn ? 'warn' : 'ok';
    const zone = fireZoneCells[i];
    if (zone) {
      return `<button type="button" class="event-fire-cell event-fire-cell--${cls}" data-fire-zone="${zone.id}" aria-label="${zone.label}">
        <span>${zone.label}</span>
      </button>`;
    }
    return `<span class="event-fire-cell event-fire-cell--${cls}" aria-hidden="true"></span>`;
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
      </div>
      <div class="event-fire-core" data-fire-core>
        <i class="ti ti-flame" data-fire-core-icon></i>
        <strong data-fire-core-title>F&B B</strong>
        <span data-fire-core-status>khói + nhiệt tăng</span>
      </div>
      <div class="event-fire-matrix">${cells}</div>
    </div>
    <div class="event-fire-sensors">${sensors.map((s) =>
    `<button type="button" class="event-fire-sensor event-fire-sensor--${s.tone}" data-fire-zone="${s.id}">
      <span>${s.sensor}</span><b>${s.temp}</b><em>${s.smoke}</em>
    </button>`,
  ).join('')}</div>
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
  densityTeam: {
    tag: 'CROWD OPS',
    title: 'Điều tổ an ninh theo bản đồ mật độ',
    icon: 'ti-users-group',
    summary: 'Điều tổ theo bản đồ toàn sân: khu mật độ cao nhận đội ngay, khu cận ngưỡng có đội giữ luồng dự phòng.',
    steps: ['Điều 2 tổ tới B12', 'Giữ luồng B2 và khu D', 'Báo VOC sau 3 phút'],
    primary: 'Điều tổ',
  },
  densityReduce: {
    tag: 'DENSITY OPS',
    title: 'Giảm mật độ khán đài',
    icon: 'ti-arrows-minimize',
    summary: 'Giảm tải toàn sân bằng cách làm chậm dòng vào khu mật độ cao, mở tuyến nhận luồng ở B2/C1 và theo dõi các khu cận ngưỡng.',
    steps: ['Tạm giảm dòng vào B12', 'Ưu tiên tuyến B2/C1', 'Theo dõi mật độ từng phút'],
    primary: 'Kích hoạt giảm mật độ',
  },
  heatmap: {
    tag: 'HEATMAP',
    title: 'Bản đồ nhiệt toàn sân',
    icon: 'ti-map-search',
    summary: 'Mở lớp bản đồ nhiệt toàn sân để thấy khu mật độ cao cần điều ngay và khu cận ngưỡng gần nguy cấp.',
    steps: ['Bật lớp mật độ toàn sân', 'So sánh B12/B2/D', 'Cập nhật VOC mỗi 60 giây'],
    primary: 'Xem bản đồ nhiệt',
  },
  heatmapB12: {
    tag: 'HEATMAP',
    title: 'Bản đồ nhiệt toàn sân',
    icon: 'ti-map-search',
    summary: 'Mở lớp bản đồ nhiệt toàn sân để thấy khu mật độ cao cần điều ngay và khu cận ngưỡng gần nguy cấp.',
    steps: ['Bật lớp mật độ toàn sân', 'So sánh B12/B2/D', 'Cập nhật VOC mỗi 60 giây'],
    primary: 'Xem bản đồ nhiệt',
  },
  isolateDense: {
    tag: 'GRID OPS',
    title: 'Cô lập ô DENSE',
    icon: 'ti-grid-dots',
    summary: 'Khoanh vùng các điểm mật độ cao và cận ngưỡng trên bản đồ mật độ toàn sân để chặn dòng quay lại và giữ hành lang thoát.',
    steps: ['Đánh dấu ô đông/cận ngưỡng', 'Chặn nhánh quay lại B12', 'Mở hành lang sang EXIT'],
    primary: 'Cô lập ô DENSE',
  },
  nearestExit: {
    tag: 'EXIT OPS',
    title: 'Mở EXIT gần nhất',
    icon: 'ti-door-exit',
    summary: 'Ưu tiên mở cửa thoát gần nhất cho khu mật độ cao và khu cận ngưỡng gần nguy cấp để giảm áp lực toàn tuyến.',
    steps: ['Chọn EXIT gần nhất', 'Điều bảo vệ giữ luồng', 'Theo dõi ETA sơ tán'],
    primary: 'Mở EXIT gần nhất',
  },
  dispatchTeam: {
    tag: 'DISPATCH',
    title: 'Gửi đội cơ động tới vùng đông',
    icon: 'ti-users-group',
    summary: 'Chọn đội gần nhất theo bản đồ mật độ, ưu tiên tiếp cận B12 và kiểm tra các khu cận ngưỡng A/D.',
    steps: ['Đội nhanh 1 tới B12', 'Đội an ninh 4 giữ A/D', 'Kênh VOC-21 xác nhận'],
    primary: 'Gửi đội cơ động',
  },
  split: {
    tag: 'FLOW OPS',
    title: 'Chia luồng khán giả',
    icon: 'ti-arrows-split',
    summary: 'Kích hoạt phân luồng từ khu mật độ cao sang các tuyến nhận luồng, giảm áp lực điểm nóng trong 4 phút.',
    steps: ['Mở rào mềm B2', 'Điều 2 tổ an ninh', 'Theo dõi bản đồ nhiệt'],
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
    <div class="event-action-modal__panel event-action-modal__panel--density" role="dialog" aria-modal="true" aria-label="Điều phối sự kiện">
      <button type="button" class="event-action-modal__close" data-event-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-arrows-split" data-event-action-icon></i></span>
        <div><small data-event-action-tag>FLOW OPS</small><h3 data-event-action-title>Chia luồng khán giả</h3></div>
      </div>
      <p data-event-action-summary></p>
      <div data-event-density-map-mount>${densityModalMap('densityTeam')}</div>
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
    ${fifaEventReadinessPanel()}
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
  if (!root.dataset.eventRiskHoverBound) {
    root.dataset.eventRiskHoverBound = 'true';
    const setRiskButtonHover = (button, active) => {
      if (!button?.classList?.contains('event-risk__btn')) return;
      button.style.borderColor = active ? 'rgba(0, 180, 255, 0.48)' : '';
      button.style.background = active ? 'rgba(0, 120, 180, 0.16)' : '';
      button.style.backgroundColor = active ? 'rgba(0, 120, 180, 0.16)' : '';
      button.style.color = active ? '#e8f8ff' : '';
      const icon = button.querySelector('.ti');
      if (icon) icon.style.color = active ? '#18d8f5' : '';
    };

    root.addEventListener('pointerover', (event) => {
      const button = event.target.closest('.event-risk__btn');
      if (button && root.contains(button)) setRiskButtonHover(button, true);
    });

    root.addEventListener('pointerout', (event) => {
      const button = event.target.closest('.event-risk__btn');
      if (button && root.contains(button) && !button.contains(event.relatedTarget)) {
        setRiskButtonHover(button, false);
      }
    });
  }

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
  const selectFireZone = (zoneId = 'fb') => {
    const zone = FIRE_ZONE_DETAILS[zoneId] || FIRE_ZONE_DETAILS.fb;
    const fireCard = root.querySelector('.event-risk--fire');
    if (!fireCard) return;
    fireCard.querySelector('[data-fire-core-icon]').className = `ti ${zone.icon}`;
    fireCard.querySelector('[data-fire-core-title]').textContent = zone.label;
    fireCard.querySelector('[data-fire-core-status]').textContent = zone.status;
    const primaryIcon = fireCard.querySelector('[data-fire-primary-icon]');
    if (primaryIcon) primaryIcon.className = `ti ${zone.icon}`;
    const primaryLabel = fireCard.querySelector('[data-fire-primary-label]');
    if (primaryLabel) primaryLabel.textContent = zone.primary;
    const powerLabel = fireCard.querySelector('[data-fire-power-label]');
    if (powerLabel) powerLabel.textContent = zone.power;
    const ventLabel = fireCard.querySelector('[data-fire-vent-label]');
    if (ventLabel) ventLabel.textContent = zone.ventilation;
    fireCard.querySelectorAll('[data-fire-zone]').forEach((node) => {
      const active = node.dataset.fireZone === zoneId;
      if (node.classList.contains('event-fire-cell')) node.classList.toggle('event-fire-cell--active', active);
      if (node.classList.contains('event-fire-sensor')) node.classList.toggle('event-fire-sensor--active', active);
      node.setAttribute('aria-pressed', String(active));
    });
  };

  const fillAction = (action, actionKey = 'densityTeam') => {
    if (!modal || !action) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.querySelector('[data-event-action-icon]').className = `ti ${action.icon}`;
    modal.querySelector('[data-event-action-tag]').textContent = action.tag;
    modal.querySelector('[data-event-action-title]').textContent = action.title;
    modal.querySelector('[data-event-action-summary]').textContent = action.summary;
    modal.querySelector('[data-event-action-primary]').textContent = action.primary;
    modal.querySelector('[data-event-action-status]').textContent = 'Chờ xác nhận điều phối.';
    delete modal.dataset.reportSent;
    modal.dataset.reportPayload = encodeURIComponent(JSON.stringify({
      title: action.title,
      summary: action.summary,
      steps: action.steps,
      type: actionKey.includes('fire') ? 'fire' : 'crowd',
      tone: actionKey.includes('heatmap') ? 'ok' : 'warn',
      owner: action.tag,
      status: 'Chưa giải quyết',
    }));
    const densityMount = modal.querySelector('[data-event-density-map-mount]');
    if (densityMount) densityMount.innerHTML = densityModalMap(actionKey);
    modal.querySelector('[data-event-action-steps]').innerHTML = action.steps
      .map((step, i) => `<span><b>${String(i + 1).padStart(2, '0')}</b>${step}</span>`)
      .join('');
    modal.hidden = false;
  };

  root.addEventListener('click', (event) => {
    const fireZone = event.target.closest('[data-fire-zone]');
    if (fireZone && fireZone.matches('button')) {
      selectFireZone(fireZone.dataset.fireZone);
      return;
    }

    const btn = event.target.closest('.event-risk__btn');
    if (!btn || btn.dataset.dispatchOpen) return;
    const actionKey = btn.dataset.eventActionOpen === 'heatmapB12' ? 'heatmap' : btn.dataset.eventActionOpen;
    if (actionKey && EVENT_ACTIONS[actionKey]) {
      fillAction(EVENT_ACTIONS[actionKey], actionKey);
      return;
    }
    const icon = btn.querySelector('.ti');
    const cls = icon?.className || '';
    if (cls.includes('ti-arrows-split')) fillAction(EVENT_ACTIONS.split, 'split');
    else if (cls.includes('ti-arrow-guide')) fillAction(EVENT_ACTIONS.reverse, 'reverse');
    else if (cls.includes('ti-speakerphone')) fillAction(EVENT_ACTIONS.paGuide, 'paGuide');
    else if (cls.includes('ti-volume')) fillAction(EVENT_ACTIONS.paSplit, 'paSplit');
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
      if (activeModal.dataset.reportSent !== 'true') {
        try {
          addOperationalReport(JSON.parse(decodeURIComponent(activeModal.dataset.reportPayload || '%7B%7D')));
        } catch {
          addOperationalReport({
            title: 'Kích hoạt điều phối sự kiện',
            summary: 'Đã gửi lệnh điều phối tới PA, an ninh và đội cổng.',
            type: 'crowd',
            tone: 'warn',
          });
        }
        activeModal.dataset.reportSent = 'true';
      }
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
    return new Promise((resolve) => {
      smokeTimer = setInterval(() => {
        const next = fireSystemController.smokePct + 4 + Math.random() * 7;
        setSmokePct(next);
        if (fireSystemController.smokePct >= 100) {
          clearInterval(smokeTimer);
          smokeTimer = null;
          fireSystemController.emit('smoke-extract-complete', { zone: 'F&B B' });
          resolve();
        }
      }, 220);
    });
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
    return new Promise((resolve) => {
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
          resolve();
        }
      }, 260);
      return;
      }

      const zone = fireSystemController.powerZones.find((item) => item.name === zoneName);
      if (!zone) {
        if (status) status.textContent = 'Vui lòng chọn một khu vực trước khi xác nhận.';
        resolve();
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
        resolve();
      }, 420);
    });
  };

  const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

  const addPowerReport = (turnOn, zoneName = '') => {
    addOperationalReport({
      title: `${turnOn ? 'Mở điện' : 'Cắt điện'} ${zoneName || 'toàn bộ SVĐ'}`,
      summary: zoneName
        ? `Đã ${turnOn ? 'mở điện lại' : 'cắt điện'} ${zoneName} từ bảng điều khiển sự kiện.`
        : `Đã ${turnOn ? 'mở điện lại' : 'cắt điện'} toàn bộ hệ thống sân vận động.`,
      steps: ['Xác nhận thao tác nguồn', 'Cập nhật trạng thái từng khu', 'Ghi log BMS/VOC'],
      type: 'power',
      tone: turnOn ? 'ok' : 'warn',
      resolved: true,
      owner: 'Kỹ thuật điện',
      status: 'Đã xử lý',
    });
  };

  const startFireAutoChain = async (button) => {
    if (!button || button.dataset.running === 'true') return;
    const status = root.querySelector('[data-fire-auto-status]');
    button.dataset.running = 'true';
    button.disabled = true;
    button.classList.add('event-fire-auto__button--running');
    if (status) status.textContent = '01 · Đang tự động cắt điện toàn bộ SVĐ';
    preparePowerConfirm({ turnOn: false, showConfirm: false });
    await runPowerSequence(false);
    await sleep(450);
    if (powerModal) powerModal.hidden = true;

    if (status) status.textContent = '02 · Đang mở hút khói khu nguy cơ';
    await startSmokeExtraction();
    await sleep(450);
    if (smokeModal) smokeModal.hidden = true;

    if (status) status.textContent = '03 · Đang gọi cứu hỏa / sơ tán';
    openDispatchDialog('medical', {
      type: 'fire',
      note: 'Auto PCCC: đã cắt điện toàn bộ SVĐ, đã hút khói khu nguy cơ, yêu cầu cứu hỏa / sơ tán xác nhận tiếp nhận.',
      titleSuffix: 'cứu hỏa / sơ tán',
    });
    await sleep(120);
    const fireDialog = document.querySelector('[data-dispatch-dialog="medical"]:not([hidden])');
    fireDialog?.querySelector('[data-dispatch-call]')?.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
    if (status) status.textContent = 'Đã gọi cứu hỏa / sơ tán. Bấm Kết thúc & gửi yêu cầu trong form.';
    addOperationalReport({
      title: 'Auto PCCC đã kích hoạt',
      summary: 'Auto PCCC đã cắt điện toàn bộ SVĐ, hút khói khu nguy cơ và gọi cứu hỏa / sơ tán tiếp nhận.',
      steps: ['Cắt điện toàn bộ SVĐ', 'Hút khói khu nguy cơ', 'Gọi cứu hỏa / sơ tán'],
      type: 'fire',
      tone: 'danger',
      owner: 'Phụ trách PCCC',
      status: 'Chưa giải quyết',
    });
    button.classList.remove('event-fire-auto__button--running');
    button.classList.add('event-fire-auto__button--done');
    button.disabled = false;
    button.dataset.running = 'false';
  };

  root.addEventListener('click', (event) => {
    const autoBtn = event.target.closest('[data-fire-auto-chain]');
    if (autoBtn) {
      startFireAutoChain(autoBtn);
      return;
    }

    const fireBtn = event.target.closest('[data-fire-action]');
    if (!fireBtn) return;
    if (fireBtn.dataset.fireAction === 'smoke') {
      startSmokeExtraction().then(() => {
        addOperationalReport({
          title: 'Hút khói khu nguy cơ',
          summary: 'Đã khởi động quạt hút khói và đưa cảm biến khu nguy cơ về ngưỡng an toàn.',
          steps: ['Mở quạt hút khói', 'Tạo áp âm hành lang', 'Theo dõi cảm biến khói'],
          type: 'fire',
          tone: 'ok',
          resolved: true,
          owner: 'Phụ trách PCCC',
          status: 'Đã xử lý',
        });
      });
    }
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
      const turnOn = activePowerModal.dataset.powerIntent === 'on';
      const zoneName = activePowerModal.dataset.powerZone;
      runPowerSequence(turnOn, zoneName).then(() => addPowerReport(turnOn, zoneName));
    }
  };

  powerModal?.addEventListener('click', handlePowerModalClick);
  powerModal?.querySelector('[data-power-accept]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const turnOn = powerModal.dataset.powerIntent === 'on';
    const zoneName = powerModal.dataset.powerZone;
    runPowerSequence(turnOn, zoneName).then(() => addPowerReport(turnOn, zoneName));
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
      const turnOn = activePowerModal.dataset.powerIntent === 'on';
      const zoneName = activePowerModal.dataset.powerZone;
      runPowerSequence(turnOn, zoneName).then(() => addPowerReport(turnOn, zoneName));
    }
  });
}
