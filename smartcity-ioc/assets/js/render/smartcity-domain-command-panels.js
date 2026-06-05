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
  return `<section class="hud-block sc-diagram" data-diagram-family="fifa-checklist">
    ${hudHead(title)}
    <div class="sc-checklist">
      ${items.map((item) => `<span class="sc-check sc-check--${item.tone || 'ok'}">
        <i class="ti ${item.icon || 'ti-check'}"></i><b>${item.value}</b><em>${item.label}</em>
      </span>`).join('')}
    </div>
  </section>`;
}

function environmentThermalMap() {
  const cells = [
    { label: 'FOP', value: '24.2°', tone: 'ok' },
    { label: 'VIP', value: '23.8°', tone: 'ok' },
    { label: 'A', value: '25.1°', tone: 'ok' },
    { label: 'B', value: '26.4°', tone: 'warn' },
    { label: 'Media', value: '24.8°', tone: 'ok' },
    { label: 'Fan', value: '27.1°', tone: 'warn' },
    { label: 'Lake', value: 'pH 7.2', tone: 'ok' },
    { label: 'Park', value: 'OK', tone: 'ok' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="thermal-grid">
    ${hudHead('Bản đồ môi trường FIFA')}
    <div class="sc-thermal">
      <div class="sc-thermal__dial" style="--pct:92"><strong>92%</strong><span>VOC score</span></div>
      <div class="sc-thermal__grid">
        ${cells.map((cell) => `<i class="sc-thermal__cell sc-thermal__cell--${cell.tone}">
          <b>${cell.label}</b><span>${cell.value}</span>
        </i>`).join('')}
      </div>
    </div>
  </section>`;
}

function environmentNetwork() {
  const nodes = [
    { label: 'PM2.5', value: '18', icon: 'ti-mist', tone: 'ok' },
    { label: 'CO2', value: '642', icon: 'ti-cloud', tone: 'ok' },
    { label: 'Noise', value: '54dB', icon: 'ti-volume', tone: 'ok' },
    { label: 'Temp', value: '24°', icon: 'ti-temperature', tone: 'ok' },
    { label: 'Humidity', value: '61%', icon: 'ti-droplet', tone: 'ok' },
    { label: 'VOC', value: '0.18', icon: 'ti-leaf', tone: 'warn' },
  ].map((node, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return { ...node, x: 50 + Math.cos(angle) * 36, y: 50 + Math.sin(angle) * 31 };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="sensor-network">
    ${hudHead('Mạng cảm biến môi trường')}
    <div class="sc-node-map sc-node-map--environment">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="sc-node-map__halo" cx="50" cy="50" r="19"/>
        <circle class="sc-node-map__hub" cx="50" cy="50" r="7"/>
        ${nodes.map((n) => `<line class="sc-node-map__line sc-node-map__line--${n.tone}" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-node-map__node sc-node-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.4"/>`).join('')}
      </svg>
      <div class="sc-node-map__labels">
        ${nodes.map((n) => `<span class="sc-node-label sc-node-label--${n.tone}"><i class="ti ${n.icon}"></i><b>${n.label}</b><em>${n.value}</em></span>`).join('')}
      </div>
    </div>
  </section>`;
}

function environmentRadar() {
  const axes = [
    { label: 'Air', value: 88 },
    { label: 'FOP', value: 94 },
    { label: 'Noise', value: 82 },
    { label: 'Water', value: 96 },
    { label: 'Waste', value: 86 },
  ];
  const points = axes.map((axis, index) => {
    const angle = (-90 + index * (360 / axes.length)) * Math.PI / 180;
    const r = axis.value * 0.36;
    return `${50 + Math.cos(angle) * r},${50 + Math.sin(angle) * r}`;
  }).join(' ');
  return `<section class="hud-block sc-diagram" data-diagram-family="radar">
    ${hudHead('Compliance VOC/FIFA')}
    <div class="sc-radar">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon class="sc-radar__ring" points="50,14 84,39 71,80 29,80 16,39"/>
        <polygon class="sc-radar__ring sc-radar__ring--inner" points="50,27 70,42 62,66 38,66 30,42"/>
        ${axes.map((axis, index) => {
    const angle = (-90 + index * (360 / axes.length)) * Math.PI / 180;
    const x = 50 + Math.cos(angle) * 39;
    const y = 50 + Math.sin(angle) * 39;
    return `<line class="sc-radar__axis" x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  }).join('')}
        <polygon class="sc-radar__shape" points="${points}"/>
      </svg>
      <div class="sc-radar__legend">${axes.map((axis) => `<span><b>${axis.value}</b><em>${axis.label}</em></span>`).join('')}</div>
    </div>
  </section>`;
}

function environmentLoadMatrix() {
  const cols = [
    { label: 'PM', value: 3 },
    { label: 'CO2', value: 2 },
    { label: 'dB', value: 3 },
    { label: 'Temp', value: 4 },
    { label: 'H2O', value: 2 },
    { label: 'VOC', value: 4 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="load-matrix">
    ${hudHead('Ngưỡng theo ca vận hành')}
    <div class="sc-load-matrix">
      ${cols.map((col) => `<div class="sc-load-col">
        ${Array.from({ length: 5 }, (_, i) => {
    const on = i >= 5 - col.value;
    const tone = !on ? 'idle' : col.value >= 4 ? 'warn' : 'ok';
    return `<i class="sc-load-cell sc-load-cell--${tone}"></i>`;
  }).join('')}
        <span>${col.label}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function utilityNodeMap() {
  const nodes = [
    { label: 'Grid', value: '2N', icon: 'ti-bolt', tone: 'power' },
    { label: 'UPS', value: '38m', icon: 'ti-battery-3', tone: 'power' },
    { label: 'Gen', value: 'Ready', icon: 'ti-engine', tone: 'power' },
    { label: 'Lux', value: '1400', icon: 'ti-bulb', tone: 'lighting' },
    { label: 'PA/LED', value: '100%', icon: 'ti-device-tv', tone: 'media' },
    { label: 'Water', value: '96%', icon: 'ti-droplet', tone: 'water' },
  ].map((node, index, arr) => {
    const angle = (-90 + index * (360 / arr.length)) * Math.PI / 180;
    return { ...node, x: 50 + Math.cos(angle) * 37, y: 50 + Math.sin(angle) * 32 };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="utility-node-map">
    ${hudHead('Sơ đồ node tiện ích Matchday')}
    <div class="sc-node-map sc-node-map--utility">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect class="sc-node-map__pitch" x="35" y="37" width="30" height="26" rx="13"/>
        <circle class="sc-node-map__hub" cx="50" cy="50" r="7"/>
        ${nodes.map((n) => `<path class="sc-node-map__line sc-node-map__line--${n.tone}" d="M50 50L${n.x.toFixed(1)} ${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-node-map__node sc-node-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.2"/>`).join('')}
      </svg>
      <div class="sc-node-map__labels">
        ${nodes.map((n) => `<span class="sc-node-label sc-node-label--${n.tone}"><i class="ti ${n.icon}"></i><b>${n.label}</b><em>${n.value}</em></span>`).join('')}
      </div>
    </div>
  </section>`;
}

function utilityServiceMap() {
  const lots = [
    { label: 'FOP', value: 94, tone: 'ok' },
    { label: 'Broadcast', value: 91, tone: 'ok' },
    { label: 'VIP', value: 88, tone: 'ok' },
    { label: 'Concourse', value: 76, tone: 'warn' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="service-map">
    ${hudHead('Phân bổ tải tiện ích')}
    <div class="sc-service-map">
      <div class="sc-service-map__top">
        <div class="sc-service-map__ring" style="--pct:91"><strong>91%</strong><span>SLA</span></div>
        <div class="sc-service-map__bars">
          ${lots.map((lot) => `<span><b>${lot.label}</b><em><i style="width:${lot.value}%"></i></em><strong>${lot.value}%</strong></span>`).join('')}
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
      <text x="${x + 14}" y="${y + 11}">${lot.label}</text>
    </g>`;
  }).join('')}
      </svg>
    </div>
  </section>`;
}

function utilityFlow() {
  const checks = [
    { label: 'Nguồn A', value: 'OK', tone: 'ok' },
    { label: 'UPS', value: '38m', tone: 'ok' },
    { label: 'Gen', value: 'Ready', tone: 'ok' },
    { label: 'Lux', value: 'Cân bằng', tone: 'warn' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="route-flow">
    ${hudHead('Luồng khôi phục kỹ thuật')}
    <div class="sc-route-flow">
      <svg viewBox="0 0 160 68" aria-hidden="true">
        <path class="sc-route-flow__route" d="M12 18h54l20 16h62"/>
        <path class="sc-route-flow__route sc-route-flow__route--alt" d="M12 50h58l16-16"/>
        <circle class="sc-route-flow__node" cx="20" cy="18" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--warn" cx="86" cy="34" r="7"/>
        <circle class="sc-route-flow__node sc-route-flow__node--ok" cx="140" cy="34" r="7"/>
        <text x="20" y="21">VOC</text><text x="86" y="37">BMS</text><text x="140" y="37">FOP</text>
      </svg>
      <div class="sc-route-flow__checks">
        ${checks.map((check) => `<span class="sc-route-check sc-route-check--${check.tone}"><b>${check.label}</b><em>${check.value}</em></span>`).join('')}
      </div>
    </div>
  </section>`;
}

function utilityLoadTowers() {
  const bars = [
    { label: '15h', value: 42 },
    { label: '16h', value: 58 },
    { label: '17h', value: 74 },
    { label: '18h', value: 81 },
    { label: '19h', value: 88 },
    { label: '20h', value: 69 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="queue-bars">
    ${hudHead('Tải tiện ích theo giờ')}
    <div class="sc-queue-bars">
      ${bars.map((bar) => `<span class="sc-queue-bar sc-queue-bar--${bar.value >= 84 ? 'warn' : 'ok'}">
        <em>${bar.label}</em><i style="height:${bar.value}%"></i><b>${bar.value}%</b>
      </span>`).join('')}
    </div>
  </section>`;
}

function utilityLuxGrid() {
  const zones = [
    ['FOP A', '1420'], ['FOP B', '1390'], ['VAR', '1100'],
    ['Camera 1', '1500'], ['Camera 2', '1480'], ['Stand', '620'],
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="lux-grid">
    ${hudHead('Chiếu sáng broadcast')}
    <div class="sc-lux-grid">
      ${zones.map(([label, value], index) => `<span class="sc-lux-cell sc-lux-cell--${index === 2 ? 'warn' : 'ok'}">
        <i class="ti ti-bulb"></i><b>${value}</b><em>${label}</em>
      </span>`).join('')}
    </div>
  </section>`;
}

function reportSummary() {
  return `<section class="hud-block sc-diagram" data-diagram-family="report-summary">
    ${hudHead('Báo cáo VOC Matchday')}
    <div class="sc-report-summary">
      <div class="sc-report-summary__ring" style="--pct:42"><strong>42%</strong><span>case</span></div>
      <div class="sc-report-summary__chips">
        <span><b>37</b><em>Đã đóng</em></span>
        <span class="sc-report-summary__warn"><b>5</b><em>Theo dõi FIFA</em></span>
      </div>
    </div>
  </section>`;
}

function reportTimeline() {
  const items = [
    { time: '16:00', id: 'VOC-01', status: 'Checklist', tone: 'ok' },
    { time: '17:20', id: 'ENV-04', status: 'AQI OK', tone: 'ok' },
    { time: '18:05', id: 'UTIL-07', status: 'Lux warn', tone: 'warn' },
    { time: '19:30', id: 'FIFA-12', status: 'SLA', tone: 'ok' },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="timeline">
    ${hudHead('Timeline báo cáo')}
    <div class="sc-report-timeline">
      ${items.map((item) => `<button type="button" class="sc-report-timeline__node sc-report-timeline__node--${item.tone}">
        <i></i><strong>${item.time}</strong><span>${item.id}</span><b>${item.status}</b>
      </button>`).join('')}
    </div>
  </section>`;
}

function reportResolution() {
  const items = [
    { label: 'L1', value: 97 },
    { label: 'L2', value: 91 },
    { label: 'L3', value: 86 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="resolution-rings">
    ${hudHead('Tỉ lệ khép vòng')}
    <div class="sc-resolution-rings">
      ${items.map((item) => `<div class="sc-resolution-ring" style="--pct:${item.value}">
        <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="30"></circle><circle cx="40" cy="40" r="30"></circle></svg>
        <strong>${item.value}%</strong><span>${item.label}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function reportIncidentMatrix() {
  const items = [
    { label: 'Môi trường', value: 18 },
    { label: 'Tiện ích', value: 24 },
    { label: 'An ninh', value: 22 },
    { label: 'Giao thông', value: 19 },
    { label: 'FIFA', value: 17 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="incident-matrix">
    ${hudHead('Ma trận tiêu chuẩn FIFA')}
    <div class="sc-incident-matrix">
      ${items.map((item, index) => `<span style="--pct:${item.value + 42}%">
        <em>${item.label}</em><i></i><b>${item.value}%</b>
      </span>`).join('')}
    </div>
  </section>`;
}

function reportOverviewMap() {
  const nodes = [0, 60, 120, 180, 240, 300].map((deg, index) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 50 + Math.cos(rad) * 34, y: 50 + Math.sin(rad) * 34, tone: index === 2 ? 'warn' : 'ok' };
  });
  return `<section class="hud-block sc-diagram" data-diagram-family="report-node-map">
    ${hudHead('Nguồn dữ liệu báo cáo')}
    <div class="sc-report-map">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="sc-report-map__ring" cx="50" cy="50" r="24"/>
        <circle class="sc-report-map__core" cx="50" cy="50" r="8"/>
        ${nodes.map((n) => `<line class="sc-report-map__line" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join('')}
        ${nodes.map((n) => `<circle class="sc-report-map__node sc-report-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.5"/>`).join('')}
      </svg>
      <div class="sc-report-map__side">
        <span><b>6/6</b><em>Nguồn live</em></span>
        <span><b>FIFA</b><em>Checklist</em></span>
      </div>
    </div>
  </section>`;
}

function reportSendFlow() {
  const steps = [
    ['VOC', 'Dữ liệu ca', 'ti-database'],
    ['KPI', 'Chuẩn hóa', 'ti-chart-bar'],
    ['FIFA', 'Checklist', 'ti-file-check'],
    ['BTC', 'Gửi báo cáo', 'ti-send'],
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="send-flow">
    ${hudHead('Luồng gửi báo cáo')}
    <div class="sc-send-flow">
      ${steps.map(([label, sub, icon], index) => `${index ? '<i class="sc-send-flow__line"></i>' : ''}
        <span><i class="ti ${icon}"></i><b>${label}</b><em>${sub}</em></span>`).join('')}
    </div>
  </section>`;
}

function reportSensorChart() {
  const bars = [
    { label: 'AQI', value: 88 },
    { label: 'Lux', value: 91 },
    { label: 'SLA', value: 94 },
    { label: 'Clean', value: 97 },
  ];
  return `<section class="hud-block sc-diagram" data-diagram-family="report-bars">
    ${hudHead('Chỉ số đưa vào báo cáo')}
    <div class="sc-report-bars">
      ${bars.map((bar) => `<span><em>${bar.label}</em><i style="height:${bar.value}%"></i><b>${bar.value}%</b></span>`).join('')}
    </div>
  </section>`;
}

const pageRenderers = {
  environment: {
    left: () => [
      heroMetric({
        title: 'Môi trường VOC/FIFA',
        icon: 'ti-leaf',
        label: 'Chỉ số comfort',
        value: '92/100',
        sub: 'Theo dõi AQI, tiếng ồn, nhiệt độ FOP và chất lượng nước khu công viên.',
      }),
      environmentThermalMap(),
      environmentNetwork(),
      environmentLoadMatrix(),
    ].join(''),
    right: () => [
      environmentRadar(),
      standardChecklist('Chuẩn vận hành môi trường', [
        { label: 'PM2.5 dưới ngưỡng', value: '18 µg', icon: 'ti-mist' },
        { label: 'FOP 18-26°C', value: 'OK', icon: 'ti-temperature' },
        { label: 'Noise < 85 dB', value: '54 dB', icon: 'ti-volume' },
        { label: 'Nước pH 6.5-8.5', value: '7.2', icon: 'ti-droplet' },
      ]),
      statusAlerts('Cảnh báo môi trường', [
        { tag: 'VOC', title: 'Chỉ số VOC khu Fan zone tăng nhẹ', time: '6 phút', tone: AMBER },
        { tag: 'FOP', title: 'Nhiệt độ sân thi đấu trong dải FIFA', time: '12 phút', tone: GREEN },
        { tag: 'Lake', title: 'Hồ công viên đạt pH 7.2, không cần xử lý', time: '21 phút', tone: BLUE },
      ]),
    ].join(''),
  },
  utilities: {
    left: () => [
      heroMetric({
        title: 'Tiện ích Matchday',
        icon: 'ti-bolt',
        label: 'SLA kỹ thuật',
        value: '99.1%',
        sub: 'Giữ nguồn 2N, UPS, máy phát, broadcast lux, PA/LED và nước theo kịch bản FIFA.',
      }),
      utilityNodeMap(),
      utilityServiceMap(),
      utilityFlow(),
    ].join(''),
    right: () => [
      utilityLoadTowers(),
      utilityLuxGrid(),
      standardChecklist('Chuẩn tiện ích FIFA', [
        { label: 'Nguồn điện 2N', value: 'Ready', icon: 'ti-bolt' },
        { label: 'UPS thiết bị trọng yếu', value: '38m', icon: 'ti-battery-3' },
        { label: 'Broadcast lux', value: '1400', icon: 'ti-bulb' },
        { label: 'PA/LED online', value: '100%', icon: 'ti-device-tv' },
      ]),
      statusAlerts('Cảnh báo tiện ích', [
        { tag: 'Lux', title: 'Camera VAR cần cân lại vùng sáng phụ', time: '4 phút', tone: AMBER },
        { tag: 'UPS', title: 'UPS-B đang giữ tải ưu tiên ổn định', time: '10 phút', tone: BLUE },
        { tag: 'Water', title: 'Áp lực nước khu vệ sinh đạt SLA', time: '17 phút', tone: GREEN },
      ]),
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
      reportSendFlow(),
      standardChecklist('Checklist báo cáo FIFA', [
        { label: 'Matchday command log', value: 'Done', icon: 'ti-file-check' },
        { label: 'SLA khép vòng', value: '94%', icon: 'ti-refresh' },
        { label: 'KPI môi trường', value: 'OK', icon: 'ti-leaf' },
        { label: 'Gửi BTC/FIFA', value: '20:30', icon: 'ti-send' },
      ]),
      statusAlerts('Dòng báo cáo', [
        { tag: 'VOC', title: 'Báo cáo ca vận hành đã tổng hợp 42 case', time: '3 phút', tone: BLUE },
        { tag: 'FIFA', title: '5 tiêu chí cần theo dõi sau trận', time: '9 phút', tone: AMBER },
        { tag: 'SLA', title: '37 case đã đóng đúng hạn', time: '15 phút', tone: GREEN },
      ]),
    ].join(''),
  },
};

export function renderSmartcityDomainLeft(pageId) {
  return pageRenderers[pageId]?.left() || '';
}

export function renderSmartcityDomainRight(pageId) {
  return pageRenderers[pageId]?.right() || '';
}
