import { hudHead } from './hud-charts.js';
import {
  distributionStack, radial3dChart,
} from './radial3d-chart.js';
import { securityExteriorHud } from '../data/security-exterior-hud.js';

const overviewSecurityActions = {
  camera: {
    title: 'Camera sân vận động',
    tag: 'SECURITY CAM',
    summary: 'Chuỗi góc nhìn từ ngoài sân vào khu vực bên trong.',
    primary: '32/32 online',
    icon: 'ti-camera',
    cameras: [
      { id: 'outer-ring', title: 'Vành đai ngoài', zone: 'Ngoại vi', status: 'Live', meta: 'Cam EXT-04 · 110°', icon: 'ti-building-stadium', feed: 'Bãi xe P4, đường vào chính, hàng rào phía Đông' },
      { id: 'gate-b', title: 'Cổng B / kiểm soát vé', zone: 'Cổng', status: 'Đông', meta: 'Cam G-B12 · 92%', icon: 'ti-ticket', feed: 'Luồng vào cổng B, queue line, điểm quét vé' },
      { id: 'stand-b12', title: 'Khán đài B12', zone: 'Khán đài', status: 'Ưu tiên', meta: 'Cam ST-B12 · AI crowd', icon: 'ti-users-group', feed: 'Mật độ ghế B12, lối đi dọc, cầu thang thoát hiểm' },
      { id: 'pitch-core', title: 'Lòng sân', zone: 'Nội sân', status: 'Ổn định', meta: 'Cam IN-02 · 4K', icon: 'ti-camera-rotate', feed: 'Khu vực thi đấu, đường biên, lối kỹ thuật' },
      { id: 'voc-wall', title: 'VOC camera wall', zone: 'Trung tâm', status: 'Đồng bộ', meta: 'Wall 8 feed · SLA <4p', icon: 'ti-layout-dashboard', feed: 'Tổng hợp camera ngoại vi, cổng, khán đài và nội sân' },
    ],
  },
  alerts: {
    title: 'Cảnh báo an ninh',
    tag: 'LIVE ALERTS',
    summary: '2 cảnh báo đang mở, ưu tiên theo mật độ và luồng vào cổng.',
    primary: '2 cảnh báo',
    icon: 'ti-bell-ringing',
    items: [
      ['Gate B', 'Mật độ cao tại queue B12', '5 phút'],
      ['P4', 'Bãi xe gần ngưỡng 88%', '9 phút'],
    ],
  },
  response: {
    title: 'Phản ứng nhanh',
    tag: 'SLA RESPONSE',
    summary: 'Thời gian phản ứng trung bình của đội an ninh đang dưới 4 phút.',
    primary: '<4p',
    icon: 'ti-clock-check',
    items: [
      ['VOC', 'Điều phối đội gần nhất', '01:20'],
      ['An ninh B', 'Có mặt tại cổng B', '03:10'],
      ['PA', 'Sẵn sàng hướng dẫn luồng', 'Online'],
    ],
  },
};

const overviewEventActions = {
  b12: {
    title: 'B12 crowd load',
    tag: 'EVENT FLOW',
    summary: 'Khán đài B12 đang có 48 ca cần theo dõi, ưu tiên mở luồng ra B2.',
    primary: '48 ca',
    icon: 'ti-users-group',
    items: [
      ['Mật độ', '92% vùng lối đi dọc', 'Cao'],
      ['Điều phối', '2 đội an ninh tại B12', 'Đang xử lý'],
      ['Khuyến nghị', 'Mở thêm nhánh thoát B2', 'Ưu tiên'],
    ],
  },
  b2: {
    title: 'B2 exit flow',
    tag: 'EXIT OPS',
    summary: 'Cổng B2 đang nhận tải thoát chính, còn trong ngưỡng điều phối.',
    primary: '84%',
    icon: 'ti-door-exit',
    items: [
      ['Lưu lượng', '84% công suất làn', 'Ổn định'],
      ['Nhân sự', '4 bảo vệ điều tiết', 'Online'],
      ['PA', 'Thông báo hướng dẫn ra B2', 'Sẵn sàng'],
    ],
  },
  c1: {
    title: 'C1 relief route',
    tag: 'ROUTE READY',
    summary: 'C1 là tuyến giảm tải dự phòng cho khán đài B và khu cổng chính.',
    primary: 'OK',
    icon: 'ti-route',
    items: [
      ['Trạng thái', 'Lối C1 thông thoáng', 'OK'],
      ['Camera', 'Cam C1-02 xác nhận', 'Live'],
      ['Kịch bản', 'Chia 30% luồng sang C1', 'Có thể kích hoạt'],
    ],
  },
  flow: {
    title: 'Luồng khán giả',
    tag: 'CROWD ROUTING',
    summary: 'Gate B đang cao, hệ thống đề xuất chia luồng B2/C1 để giảm áp lực.',
    primary: 'Gate B cao',
    icon: 'ti-route',
    items: [
      ['Gate B', 'Mật độ vào/ra tăng nhanh', 'Cao'],
      ['B2', 'Tuyến thoát chính còn 16% dư địa', 'Theo dõi'],
      ['C1', 'Tuyến giảm tải sẵn sàng', 'OK'],
    ],
  },
  sla: {
    title: 'SLA điều phối',
    tag: 'OPS SLA',
    summary: 'Mục tiêu phản ứng điều phối dưới 4 phút, hiện đang ở mức 3 phút.',
    primary: '3 phút',
    icon: 'ti-clock-bolt',
    items: [
      ['VOC', 'Gửi lệnh điều phối', '00:30'],
      ['An ninh B', 'Xác nhận hiện trường', '01:45'],
      ['PA', 'Sẵn sàng phát hướng dẫn', '03:00'],
    ],
  },
  hotspots: {
    title: 'Điểm nóng sự kiện',
    tag: 'HOTSPOT MAP',
    summary: 'Có 2 điểm nóng cần giám sát liên tục trong giờ cao điểm.',
    primary: '2',
    icon: 'ti-map-pin-exclamation',
    items: [
      ['B12', 'Mật độ khán giả cao', 'Ưu tiên'],
      ['Gate B', 'Hàng chờ tăng', 'Theo dõi'],
      ['F&B B', 'Dòng người giao cắt', 'Ổn định'],
    ],
  },
};

overviewEventActions.fireRisk = {
  title: 'Nguy cơ cháy nổ',
  tag: 'FIRE RISK',
  summary: 'Khu F&B B đang có tín hiệu khói và nhiệt tăng, cần theo dõi nguy cơ cháy nổ trong ca sự kiện.',
  primary: 'F&B B',
  icon: 'ti-flame',
  items: [
    ['F&B B', 'Khói và nhiệt tăng', 'Ưu tiên'],
    ['Kho LED', '41°C, còn trong ngưỡng', 'Theo dõi'],
    ['Kịch bản', 'Báo cháy, hút khói, cắt điện khu B', 'Sẵn sàng'],
  ],
};

const overviewReportActions = {
  queue: {
    title: 'Hàng chờ VOC',
    tag: 'REPORT QUEUE',
    summary: 'Các báo cáo đang chờ VOC kiểm tra, phân loại và chuyển đội xử lý.',
    primary: '6 việc',
    icon: 'ti-inbox',
    items: [
      ['VOC-21', 'Camera cổng D mất tín hiệu', 'Đang kiểm tra'],
      ['VOC-22', 'Mật độ Gate B tăng nhanh', 'Ưu tiên'],
      ['VOC-23', 'F&B C12 bổ sung nước', 'Theo dõi'],
    ],
  },
  closedReports: {
    title: 'Báo cáo đã đóng',
    tag: 'CLOSED CASES',
    summary: '21 trên 28 báo cáo đã hoàn tất, còn lại đang theo dõi hoặc cần xác nhận.',
    primary: '21/28',
    icon: 'ti-circle-check',
    items: [
      ['An ninh', '12 báo cáo đóng', 'SLA 96%'],
      ['Dịch vụ', '5 báo cáo đóng', 'SLA 91%'],
      ['Hạ tầng', '4 báo cáo đóng', 'SLA 88%'],
    ],
  },
  priorityReports: {
    title: 'Báo cáo ưu tiên',
    tag: 'PRIORITY',
    summary: '2 ticket ưu tiên cần được VOC theo dõi sát trong ca trực hiện tại.',
    primary: '2 ticket',
    icon: 'ti-alert-triangle',
    items: [
      ['P1', 'Gate B mật độ cao', 'Cần cập nhật 5 phút/lần'],
      ['P2', 'Camera D chập chờn', 'Đợi xác nhận khôi phục'],
      ['Next', 'Tự động nhắc trưởng ca', 'Sẵn sàng'],
    ],
  },
};

function radarChart(values, labels) {
  const cx = 74;
  const cy = 66;
  const maxR = 46;
  const labelR = 58;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const labelStyle = (i) => {
    const angleDeg = (-90 + i * (360 / sides) + 360) % 360;
    if (angleDeg >= 315 || angleDeg < 45) return { anchor: 'middle', extraR: 5 };
    if (angleDeg >= 45 && angleDeg < 135) return { anchor: 'start', extraR: 14 };
    if (angleDeg >= 135 && angleDeg < 225) return { anchor: 'middle', extraR: 5 };
    return { anchor: 'end', extraR: 8 };
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, maxR * v)).join(' ');
  const axes = labels.map((label, i) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    const style = labelStyle(i);
    const r = labelR + style.extraR;
    const tx = cx + Math.cos(angle) * r;
    const ty = cy + Math.sin(angle) * r;
    const [x2, y2] = point(i, maxR).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${style.anchor}">${label}</text>`;
  }).join('');
  return `<svg class="overview-radar3d" viewBox="0 0 148 132" aria-hidden="true">
    <defs><linearGradient id="overviewRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="overview-radar3d__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(31)}"/><polygon points="${ring(maxR)}"/>
      ${axes}
    </g>
    <polygon class="overview-radar3d__shadow" points="${data}"/>
    <polygon class="overview-radar3d__shape" points="${data}"/>
    ${values.map((v, i) => {
    const [x, y] = point(i, maxR * v).split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/>`;
  }).join('')}
  </svg>`;
}

function compactLineChart(values, labels, id = 'overviewMiniLine') {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => {
    const x = 8 + i * (104 / (values.length - 1));
    const y = 58 - ((value - min) / range) * 42;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,62 ${points.join(' ')} 112,62`;
  return `<svg class="overview-domain-line" viewBox="0 0 120 72" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#2f6dff" stop-opacity="0.04"/>
    </linearGradient></defs>
    <g class="overview-domain-line__grid">
      ${[16, 30, 44, 58].map((y) => `<line x1="8" y1="${y}" x2="112" y2="${y}"/>`).join('')}
      ${labels.map((label, i) => `<text x="${8 + i * (104 / (labels.length - 1))}" y="70" text-anchor="middle">${label}</text>`).join('')}
    </g>
    <polygon points="${area}" fill="url(#${id})"/>
    <polyline points="${points.join(' ')}" class="overview-domain-line__stroke"/>
    ${values.map((value, i) => {
    const [x, y] = points[i].split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/><text x="${x}" y="${Number(y) - 6}" class="overview-domain-line__value">${value}</text>`;
  }).join('')}
  </svg>`;
}

function serviceFlowChart(items) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="overview-service-flow">
    ${items.map((item) => `<div class="overview-service-flow__row">
      <span>${item.label}</span>
      <i><b style="width:${Math.round((item.value / max) * 100)}%"></b></i>
      <strong>${item.meta}</strong>
    </div>`).join('')}
  </div>`;
}

function facilityBars(items) {
  return `<div class="overview-facility-line">
    ${compactLineChart(items.map((item) => item.value), items.map((item) => item.time), 'overviewFacilityLine')
    .replace(/class="overview-domain-line__value">(\d+)<\/text>/g, 'class="overview-domain-line__value">$1%</text>')}
  </div>`;
}

function overviewIngressDiagram(ingress) {
  const values = [940, 1180, 1320, 1540, 1710, ingress.total];
  const labels = ['16h', '17h', '18h', '19h', '20h', 'Hiện'];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = 10 + index * (130 / (values.length - 1));
    const y = 66 - ((value - min) / range) * 46;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `10,72 ${points.join(' ')} 140,72`;
  return `<div class="overview-venue-total__ingress">
      <svg class="overview-venue-total__ingress-chart" viewBox="0 0 150 82" aria-hidden="true">
      <defs><linearGradient id="overviewIngressLineFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#00d4ff" stop-opacity="0.02"/>
      </linearGradient></defs>
      <g class="overview-venue-total__ingress-grid">
        ${[20, 36, 52, 68].map((y) => `<line x1="10" y1="${y}" x2="140" y2="${y}"/>`).join('')}
        ${labels.map((label, index) => `<text x="${10 + index * 26}" y="80" text-anchor="middle">${label}</text>`).join('')}
      </g>
      <polygon class="overview-venue-total__ingress-area" points="${area}"/>
      <polyline class="overview-venue-total__ingress-line" points="${points.join(' ')}"/>
      ${points.map((point, index) => {
    const [x, y] = point.split(',');
    return `<circle class="overview-venue-total__ingress-dot${index === points.length - 1 ? ' overview-venue-total__ingress-dot--live' : ''}" cx="${x}" cy="${y}" r="${index === points.length - 1 ? 3.2 : 2.2}"/>`;
  }).join('')}
      </svg>
      <div class="overview-venue-total__ingress-main">
        <i class="ti ti-door-enter"></i>
        <span><b>${ingress.total.toLocaleString('vi-VN')}</b><em><span class="overview-venue-total__ingress-label-lead">khách vào sân</span><span class="overview-venue-total__ingress-label-tail">/ giờ</span></em></span>
      </div>
  </div>`;
}

function overviewVenueChart(total, groups, capacityLabel, ingress) {
  const groupTotal = groups.reduce((sum, g) => sum + g.value, 0) || total;
  return `<div class="stad-sec-total overview-venue-total">
    <div class="stad-sec-total__top">
      ${radial3dChart(groups, { idSuffix: 'OverviewVenue' })}
      <div class="overview-venue-total__main">
        <strong>${total.toLocaleString('vi-VN')}</strong>
        <span>${capacityLabel}</span>
      </div>
    </div>
    ${distributionStack(groups, groupTotal)}
    <div class="overview-venue-badges">
      <span><b>87%</b><em>Lấp đầy</em></span>
      <span><b>4</b><em>Khán đài</em></span>
      <span><b>VOC</b><em>Online</em></span>
    </div>
    ${overviewIngressDiagram(ingress)}
  </div>`;
}

function overviewRouteDiagram(items) {
  const [start, middle, end] = items;
  return `<div class="overview-route-diagram">
    <button type="button" class="overview-route-diagram__node overview-route-diagram__node--hot" data-overview-event-action="${start.action}">
      <b>${start.label}</b><em>${start.value}</em>
    </button>
    <span class="overview-route-diagram__line"></span>
    <button type="button" class="overview-route-diagram__node overview-route-diagram__node--mid" data-overview-event-action="${middle.action}">
      <b>${middle.label}</b><em>${middle.value}</em>
    </button>
    <span class="overview-route-diagram__line overview-route-diagram__line--ok"></span>
    <button type="button" class="overview-route-diagram__node overview-route-diagram__node--ok" data-overview-event-action="${end.action}">
      <b>${end.label}</b><em>${end.value}</em>
    </button>
  </div>`;
}

function overviewNodeMap(nodes) {
  const center = { x: 50, y: 50 };
  const left = [nodes[0], nodes[1]];
  const right = [nodes[2], nodes[4]];
  const metric = (node) => `<span class="overview-node-map__metric overview-node-map__metric--${node.tone}">
    <b>${node.value}</b><em>${node.name}</em>
  </span>`;
  return `<div class="overview-node-map" aria-hidden="true">
    <div class="overview-node-map__side overview-node-map__side--left">
      ${left.map(metric).join('')}
    </div>
    <svg viewBox="0 0 100 100">
      <circle class="overview-node-map__ring" cx="50" cy="50" r="30"/>
      <circle class="overview-node-map__axis" cx="50" cy="50" r="18"/>
      ${nodes.map((node) => `<line class="overview-node-map__line overview-node-map__line--${node.tone}" x1="${center.x}" y1="${center.y}" x2="${node.x}" y2="${node.y}"/>`).join('')}
      <circle class="overview-node-map__core" cx="50" cy="50" r="9"/>
      ${nodes.map((node) => `<g class="overview-node-map__node overview-node-map__node--${node.tone}" transform="translate(${node.x} ${node.y})">
        <circle r="7"/><text y="2.7">${node.label}</text>
      </g>`).join('')}
    </svg>
    <div class="overview-node-map__side overview-node-map__side--right">
      ${right.map(metric).join('')}
    </div>
  </div>`;
}

function overviewInfoList(items) {
  return `<div class="overview-info-list">
    ${items.map((item) => {
    const inferredAction = {
      'ti-route': 'flow',
      'ti-clock-bolt': 'sla',
      'ti-map-pin-exclamation': 'hotspots',
      'ti-inbox': 'queue',
      'ti-circle-check': 'closedReports',
      'ti-alert-triangle': 'priorityReports',
    }[item.icon];
    const action = item.action || inferredAction;
    const attrs = action ? ` type="button" data-overview-action="${action}"` : '';
    const tag = action ? 'button' : 'span';
    return `<${tag}${attrs}>
      <i class="ti ${item.icon}"></i>
      <b>${item.label}</b>
      <strong>${item.value}</strong>
    </${tag}>`;
  }).join('')}
  </div>`;
}

function overviewMetricDiagram(items) {
  return `<div class="overview-metric-diagram" aria-hidden="true">
    ${items.map((item, index) => `<span class="overview-metric-diagram__node">
      <b>${item.value}</b><em>${item.label}</em>
      ${index < items.length - 1 ? '<i></i>' : ''}
    </span>`).join('')}
  </div>`;
}

function domainCard(card) {
  return `<section class="hud-block overview-domain overview-domain--${card.id}">
    ${hudHead(card.title)}
    <div class="overview-domain__body">${card.chart}</div>
    ${card.diagram || ''}
  </section>`;
}

export function renderOverviewLeft(d) {
  const cards = [
    {
      id: 'venue',
      title: 'Tổng quan sân',
      chart: `<div class="overview-domain__stack overview-domain__stack--venue">
        ${overviewVenueChart(d.venue.total, d.venue.groups, d.venue.capacityLabel, securityExteriorHud.left.ingress)}
      </div>`,
      kpis: [
        { value: `${d.venue.pct}%`, label: 'Lấp đầy' },
        { value: '4', label: 'Khán đài' },
        { value: 'VOC', label: 'Online' },
      ],
    },
    {
      id: 'security',
      title: 'An ninh',
      chart: `<div class="overview-domain__stack">
        ${radarChart([0.88, 0.76, 0.64, 0.72, 0.94], ['SLA', 'Cổng', 'KT', 'VIP', 'Đám'])}
        ${overviewInfoList([
          { icon: 'ti-camera', label: 'Camera', value: '32/32', action: 'camera' },
          { icon: 'ti-bell-ringing', label: 'Cảnh báo', value: '2', action: 'alerts' },
          { icon: 'ti-clock-check', label: 'Phản ứng', value: '<4p', action: 'response' },
        ])}
      </div>`,
      kpis: [
        { value: '32/32', label: 'Camera' },
        { value: '2', label: 'Cảnh báo' },
        { value: '<4p', label: 'Phản ứng' },
      ],
    },
    {
      id: 'services',
      title: 'Dịch vụ',
      chart: serviceFlowChart([
        { label: 'Bãi xe P4', value: 88, meta: 'Cao' },
        { label: 'F&B C12', value: 72, meta: '6p' },
        { label: 'Y tế', value: 79, meta: 'SLA' },
        { label: 'Vé', value: 98, meta: 'Ổn định' },
      ]),
      diagram: overviewMetricDiagram([
        { value: '88%', label: 'P4' },
        { value: '6p', label: 'F&B' },
        { value: '3/3', label: 'Y tế' },
      ]),
    },
  ];
  return cards.map(domainCard).join('');
}

export function renderOverviewRight(d) {
  const total = Number(d.rollup[0]?.value || 0);
  const closed = Number(d.rollup[1]?.value || 0);
  const closePct = total ? Math.round((closed / total) * 100) : 0;
  const cards = [
    {
      id: 'events',
      title: 'Sự kiện',
      chart: `<div class="overview-domain__stack">
        ${overviewRouteDiagram([
          { label: 'B12', value: '48 ca', action: 'b12' },
          { label: 'B2', value: '84%', action: 'b2' },
          { label: 'C1', value: 'OK', action: 'c1' },
        ])}
        ${overviewInfoList([
          { icon: 'ti-route', label: 'Quá tải / dẫm đạp', value: 'B12 92%', action: 'flow' },
          { icon: 'ti-flame', label: 'Nguy cơ cháy nổ', value: 'F&B B', action: 'fireRisk' },
          { icon: 'ti-clock-bolt', label: 'SLA phản ứng', value: '3 phút', action: 'sla' },
        ])}
      </div>`,
      kpis: [
        { value: '48', label: 'Đỉnh ca' },
        { value: '84%', label: 'Ổn định' },
        { value: '2', label: 'Điểm nóng' },
      ],
    },
    {
      id: 'facilities',
      title: 'Cơ sở hạ tầng',
      chart: facilityBars([
        { time: 'HVAC', value: 92, unit: '%' },
        { time: 'UPS', value: 61, unit: '%' },
        { time: 'Lux', value: 80, unit: '%' },
        { time: 'Mái', value: 100, unit: '%' },
      ]),
      diagram: overviewMetricDiagram([
        { value: '92%', label: 'HVAC-B' },
        { value: '38p', label: 'UPS' },
        { value: 'Mở', label: 'Mái vòm' },
      ]),
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      chart: `<div class="overview-domain__stack">
        ${overviewNodeMap([
          { x: 50, y: 16, tone: 'live', label: '28', value: total, name: 'Tổng gửi' },
          { x: 78, y: 34, tone: 'ok', label: '21', value: closed, name: 'Đã đóng' },
          { x: 70, y: 74, tone: 'warn', label: '6', value: d.rollup[2]?.value || '0', name: 'Theo dõi' },
          { x: 30, y: 74, tone: 'ok', label: '75', value: `${closePct}%`, name: 'SLA' },
          { x: 22, y: 34, tone: 'warn', label: '2', value: '2', name: 'Ưu tiên' },
        ])}
        ${overviewInfoList([
          { icon: 'ti-inbox', label: 'Hàng chờ VOC', value: `${d.rollup[2]?.value || '0'} việc` },
          { icon: 'ti-circle-check', label: 'Đã đóng', value: `${closed}/${total}` },
          { icon: 'ti-alert-triangle', label: 'Ưu tiên', value: '2 ticket' },
        ])}
      </div>`,
      kpis: [
        { value: `${closePct}%`, label: 'Đã đóng' },
        { value: total, label: 'Tổng gửi' },
        { value: d.rollup[2]?.value || '0', label: 'Theo dõi' },
      ],
    },
  ];
  return cards.map(domainCard).join('');
}

function renderOverviewSecurityModal(type = 'camera', selectedCameraId = 'outer-ring') {
  const config = overviewSecurityActions[type] || overviewEventActions[type] || overviewReportActions[type] || overviewSecurityActions.camera;
  const selectedCamera = config.cameras?.find((cam) => cam.id === selectedCameraId) || config.cameras?.[0];
  const cameraGrid = config.cameras ? `<div class="overview-security-modal__camera-grid">
    ${config.cameras.map((cam) => `<button type="button" class="overview-security-modal__camera${cam.id === selectedCamera?.id ? ' overview-security-modal__camera--active' : ''}" data-overview-camera="${cam.id}">
      <i class="ti ${cam.icon}"></i>
      <span><b>${cam.title}</b><em>${cam.zone} · ${cam.meta}</em></span>
      <strong>${cam.status}</strong>
    </button>`).join('')}
  </div>` : '';
  const detail = selectedCamera ? `<div class="overview-security-modal__feed">
    <div class="overview-security-modal__viewport">
      <i class="ti ${selectedCamera.icon}"></i>
      <span>${selectedCamera.zone}</span>
      <b>${selectedCamera.title}</b>
    </div>
    <div class="overview-security-modal__feed-copy">
      <small>${selectedCamera.status}</small>
      <h4>${selectedCamera.title}</h4>
      <p>${selectedCamera.feed}</p>
      <div>
        <span>${selectedCamera.meta}</span>
        <span>AI tracking</span>
        <span>VOC sync</span>
      </div>
    </div>
  </div>` : `<div class="overview-security-modal__list">
    ${config.items.map(([zone, text, meta]) => `<span>
      <b>${zone}</b><em>${text}</em><strong>${meta}</strong>
    </span>`).join('')}
  </div>`;
  return `<div class="overview-security-modal" data-overview-security-modal>
    <button type="button" class="overview-security-modal__backdrop" data-overview-security-close aria-label="Đóng"></button>
    <section class="overview-security-modal__panel" role="dialog" aria-modal="true" aria-label="${config.title}">
      <button type="button" class="overview-security-modal__close" data-overview-security-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="overview-security-modal__head">
        <i class="ti ${config.icon}"></i>
        <div><small>${config.tag}</small><h3>${config.title}</h3><p>${config.summary}</p></div>
        <strong>${config.primary}</strong>
      </header>
      ${cameraGrid}
      ${detail}
    </section>
  </div>`;
}

export function mountOverviewOpsBind(root) {
  root?.querySelectorAll('.overview-domain').forEach((card) => {
    card.setAttribute('data-overview-domain-ready', 'true');
  });
  if (!root || root.dataset.overviewSecurityBound) return;
  root.dataset.overviewSecurityBound = 'true';

  const openModal = (type = 'camera', cameraId = 'outer-ring') => {
    document.querySelector('[data-overview-security-modal]')?.remove();
    document.body.insertAdjacentHTML('beforeend', renderOverviewSecurityModal(type, cameraId));
  };

  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-overview-action], [data-overview-event-action]');
    if (!trigger || !root.contains(trigger)) return;
    openModal(trigger.dataset.overviewAction || trigger.dataset.overviewEventAction || 'camera');
  });

  document.addEventListener('click', (event) => {
    const close = event.target.closest('[data-overview-security-close]');
    if (close) {
      close.closest('[data-overview-security-modal]')?.remove();
      return;
    }
    const camera = event.target.closest('[data-overview-camera]');
    const modal = event.target.closest('[data-overview-security-modal]');
    if (camera && modal) {
      modal.outerHTML = renderOverviewSecurityModal('camera', camera.dataset.overviewCamera);
    }
  });
}
