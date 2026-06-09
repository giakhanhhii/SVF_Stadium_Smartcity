const BLUE = '#00d4ff';

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function ringSvg(pct, label) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 86 86" class="traffic-viz-ring" aria-hidden="true">
    <circle cx="43" cy="43" r="${r}" fill="none" stroke="rgba(0,212,255,0.14)" stroke-width="8"/>
    <circle cx="43" cy="43" r="${r}" fill="none" stroke="${BLUE}" stroke-width="8"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 43 43)"/>
    <text x="43" y="38" text-anchor="middle" fill="#9bdff2" font-size="9" font-weight="800">${label}</text>
    <text x="43" y="55" text-anchor="middle" fill="${BLUE}" font-size="16" font-weight="900">${pct}%</text>
  </svg>`;
}

function trafficKpiBars(kpi) {
  const items = kpi.labels.map((label, index) => ({
    label,
    pct: Math.round((kpi.values[index] || 0) * 100),
  }));
  const modes = [
    { id: 'overview', label: 'Tổng quan', note: 'Đang xem KPI tổng hợp 5 nhóm.' },
    { id: 'signal', label: 'Tối ưu đèn', note: 'Ưu tiên đèn và tốc độ luồng xe.' },
    { id: 'camera', label: 'Camera', note: 'Tập trung camera, làn và SLA giám sát.' },
  ];

  return `<div class="traffic-kpi-bars" data-traffic-kpi>
    <div class="traffic-kpi-bars__chart" data-traffic-kpi-chart>
      ${items.map((item) => `<button type="button" class="traffic-kpi-bar" data-kpi-bar="${item.label}" aria-label="${item.label} ${item.pct}%">
        <span>${item.label}</span>
        <i><em style="height:${item.pct}%"></em></i>
        <b>${item.pct}%</b>
      </button>`).join('')}
    </div>
    <div class="traffic-kpi-bars__actions" role="group" aria-label="Bộ lọc KPI giao thông">
      ${modes.map((mode, index) => `<button type="button" class="traffic-kpi-action${index === 0 ? ' traffic-kpi-action--active' : ''}" data-kpi-mode="${mode.id}" data-kpi-note="${mode.note}">
        ${mode.label}
      </button>`).join('')}
    </div>
    <div class="traffic-kpi-bars__summary" data-traffic-kpi-summary>
      <b>94%</b><span>Điểm KPI trung bình · nhấn từng cột hoặc bộ lọc để xem ưu tiên.</span>
    </div>
  </div>`;
}

const TRAFFIC_ACCIDENT_CASES = [
  {
    id: 'ACC-A4-018',
    title: 'Va chạm xe máy · nút A4',
    location: 'A4 · làn rẽ phải',
    time: '18:42',
    severity: 'Cao',
    status: 'open',
    camera: 'CAM A4-05',
    summary: 'Hai xe máy va chạm tại vạch qua đường, một làn đang bị chiếm dụng.',
    metrics: [['2 xe', 'Liên quan'], ['01', 'Người bị nhẹ'], ['7 phút', 'Tồn tại']],
    timeline: ['AI phát hiện va chạm', 'Camera A4-05 ghim clip', 'Đội phản ứng chưa xác nhận'],
  },
  {
    id: 'ACC-B2-011',
    title: 'Ô tô dừng khẩn cấp · B2',
    location: 'B2 · làn chính',
    time: '17:55',
    severity: 'Vừa',
    status: 'open',
    camera: 'CAM B2-02',
    summary: 'Xe con dừng sau va quệt nhẹ, luồng xe phía sau giảm tốc.',
    metrics: [['1 xe', 'Liên quan'], ['0', 'Thương tích'], ['12km/h', 'Tốc độ']],
    timeline: ['Phát hiện giảm tốc đột ngột', 'Đèn cảnh báo chuyển pha ưu tiên', 'Chờ đội trực xác minh'],
  },
  {
    id: 'ACC-A4-009',
    title: 'Va quệt đã giải phóng · A4',
    location: 'A4 · hướng Đông',
    time: '16:18',
    severity: 'Nhẹ',
    status: 'done',
    camera: 'CAM A4-03',
    summary: 'Va quệt nhẹ đã xử lý, phương tiện rời hiện trường.',
    metrics: [['2 xe', 'Liên quan'], ['0', 'Thương tích'], ['6 phút', 'Xử lý']],
    timeline: ['AI phát hiện', 'Đội trực xác nhận', 'Hiện trường đã thông'],
  },
];

function accidentCaseButton(item) {
  return `<button type="button" class="traffic-accident-case traffic-accident-case--${item.status}" data-accident-case="${item.id}" data-accident-status="${item.status}">
    <span><b>${item.title}</b><em>${item.location} · ${item.time}</em></span>
    <strong>${item.status === 'open' ? 'Chưa xử lý' : 'Đã xử lý'}</strong>
  </button>`;
}

function trafficAccidentDashboard() {
  const open = TRAFFIC_ACCIDENT_CASES.filter((item) => item.status === 'open').length;
  const done = TRAFFIC_ACCIDENT_CASES.filter((item) => item.status === 'done').length;
  const stats = [
    { id: 'all', label: 'Tổng', value: TRAFFIC_ACCIDENT_CASES.length, note: 'tai nạn hôm nay' },
    { id: 'open', label: 'Chưa xử lý', value: open, note: 'cần điều phối' },
    { id: 'done', label: 'Đã xử lý', value: done, note: 'đã thông hiện trường' },
  ];
  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'open', label: 'Chưa xử lý' },
    { id: 'done', label: 'Đã xử lý' },
  ];

  return `<div class="traffic-accidents" data-traffic-accidents>
    <div class="traffic-accidents__stats">
      ${stats.map((item) => `<button type="button" class="traffic-accident-stat traffic-accident-stat--${item.id}" data-accident-filter="${item.id}">
        <span>${item.label}</span><b>${item.value}</b><em>${item.note}</em>
      </button>`).join('')}
    </div>
    <div class="traffic-accidents__filters" role="group" aria-label="Lọc tai nạn giao thông">
      ${filters.map((filter, index) => `<button type="button" class="traffic-kpi-action${index === 0 ? ' traffic-kpi-action--active' : ''}" data-accident-filter="${filter.id}">
        ${filter.label}
      </button>`).join('')}
    </div>
    <div class="traffic-accidents__list" data-accident-list>
      ${TRAFFIC_ACCIDENT_CASES.map(accidentCaseButton).join('')}
    </div>
  </div>`;
}

function trafficAccidentModal() {
  return `<div class="traffic-accident-modal" data-traffic-accident-modal hidden>
    <button type="button" class="traffic-accident-modal__backdrop" data-accident-close aria-label="Đóng"></button>
    <section class="traffic-accident-modal__panel" role="dialog" aria-modal="true" aria-label="Xử lý tai nạn giao thông">
      <button type="button" class="traffic-accident-modal__close" data-accident-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <header class="traffic-accident-modal__head">
        <span class="traffic-accident-modal__icon"><i class="ti ti-car-crash"></i></span>
        <div><small data-accident-tag>TAI NẠN GIAO THÔNG</small><h3 data-accident-title>Va chạm nút A4</h3></div>
      </header>
      <div class="traffic-accident-modal__body">
        <div class="traffic-accident-feed" data-accident-feed>
          <div class="traffic-accident-feed__road">
            <span class="traffic-accident-feed__lane traffic-accident-feed__lane--a"></span>
            <span class="traffic-accident-feed__lane traffic-accident-feed__lane--b"></span>
            <span class="traffic-accident-feed__car traffic-accident-feed__car--a"></span>
            <span class="traffic-accident-feed__car traffic-accident-feed__car--b"></span>
            <span class="traffic-accident-feed__impact"></span>
          </div>
          <div class="traffic-accident-feed__hud">
            <span data-accident-camera>CAM A4-05</span>
            <b data-accident-time>18:42</b>
            <em data-accident-location>A4 · làn rẽ phải</em>
          </div>
        </div>
        <div class="traffic-accident-modal__detail">
          <p data-accident-summary></p>
          <div class="traffic-accident-modal__metrics" data-accident-metrics></div>
          <div class="traffic-accident-modal__timeline" data-accident-timeline></div>
          <div class="traffic-accident-modal__status"><i class="ti ti-broadcast"></i><span data-accident-status-text>Chọn tai nạn để xem trạng thái xử lý.</span></div>
          <div class="traffic-accident-modal__actions">
            <button type="button" class="traffic-accident-modal__primary" data-accident-review><i class="ti ti-video"></i><span>Xem lại camera</span></button>
            <button type="button" class="traffic-accident-modal__primary traffic-accident-modal__primary--resolve" data-accident-resolve><i class="ti ti-check"></i><span>Xử lý tai nạn</span></button>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function signalCycle(d) {
  const initialMode = d.tabs?.[0] || 'A4';
  const state = d.datasets?.[initialMode] || { label: 'Xanh', pct: 75, metrics: d.metrics };
  const bars = state.metrics.map((m) => `<span class="traffic-cycle-bar" data-signal-metric>
    <em>${m.label}</em><i style="width:${m.pct}%"></i><b>${m.value}</b>
  </span>`).join('');
  return `<div class="traffic-cycle" data-traffic-signal data-signal-mode="${initialMode}">
    <div class="traffic-cycle__ring" data-signal-ring>${ringSvg(state.pct, state.label)}</div>
    <div class="traffic-cycle__bars">${bars}</div>
  </div>`;
}

function buildFlowArea(stats) {
  const items = stats.slice(0, 4);
  const points = items.map((s, index) => {
    const x = 20 + index * 48;
    const y = 94 - (s.pct || 64) * 0.62;
    return { ...s, x, y };
  });
  const line = points.map((p) => `${p.x},${p.y.toFixed(1)}`).join(' ');
  const area = `20,104 ${line} ${points[points.length - 1]?.x || 164},104`;
  const nodes = points.map((p, index) => `<g class="traffic-flow-area__node" data-flow-point="${index}">
    <text class="traffic-flow-area__value" x="${p.x}" y="${(p.y - 8).toFixed(1)}" text-anchor="middle">${p.value}</text>
    <circle cx="${p.x}" cy="${p.y.toFixed(1)}" r="3.2"/>
    <text class="traffic-flow-area__label" x="${p.x}" y="118" text-anchor="middle">${p.label}</text>
  </g>`).join('');

  return { line, area, nodes };
}

function flowAreaChart(d) {
  const initialMode = d.tabs?.[0] || 'Lưu lượng';
  const chart = buildFlowArea(d.datasets?.[initialMode] || d.stats);
  return `<div class="traffic-flow-area" data-traffic-flow-chart data-flow-mode="${initialMode}">
    <svg viewBox="0 0 184 124" aria-hidden="true">
      <defs>
        <linearGradient id="trafficFlowAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.58"/>
          <stop offset="100%" stop-color="#185fa5" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <g class="traffic-flow-area__grid">
        <line x1="20" y1="42" x2="164" y2="42"/>
        <line x1="20" y1="72" x2="164" y2="72"/>
        <line x1="20" y1="104" x2="164" y2="104"/>
      </g>
      <polygon class="traffic-flow-area__fill" points="${chart.area}"/>
      <polyline class="traffic-flow-area__line" points="${chart.line}"/>
      <g data-flow-points>${chart.nodes}</g>
    </svg>
  </div>`;
}

export function renderTrafficRightSidebar(d) {
  const sigTabs = d.signals.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}" data-signal-tab="${t}">${t}</button>`,
  ).join('');
  const flowTabs = d.flow.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}" data-flow-tab="${t}">${t}</button>`,
  ).join('');
  const flowDataset = encodeURIComponent(JSON.stringify(d.flow.datasets || {}));
  const signalDataset = encodeURIComponent(JSON.stringify(d.signals.datasets || {}));

  return `
    <section class="hud-block traffic-viz-block traffic-viz-block--radar">${hudHead(d.kpiRadar.title)}
      ${trafficAccidentDashboard()}
    </section>
    <section class="hud-block traffic-viz-block hud-block--signals">${hudHead(d.signals.title)}
      <div class="hud-tabs" data-traffic-signal-tabs data-signal-datasets="${signalDataset}">${sigTabs}</div>
      ${signalCycle(d.signals)}
    </section>
    <section class="hud-block traffic-viz-block traffic-viz-block--flow">${hudHead(d.flow.title)}
      <div class="hud-tabs hud-tabs--wrap" data-traffic-flow-tabs data-flow-datasets="${flowDataset}">${flowTabs}</div>
      ${flowAreaChart(d.flow)}
    </section>
    ${trafficAccidentModal()}`;
}

export function bindTrafficKpiControls() {
  if (document.documentElement.dataset.trafficKpiBound === 'true') return;
  document.documentElement.dataset.trafficKpiBound = 'true';

  const getAccidentModal = () => {
    const modal = document.querySelector('[data-traffic-accident-modal]');
    if (modal?.parentElement !== document.body) document.body.appendChild(modal);
    return modal;
  };

  const setAccidentCase = (modal, caseId) => {
    const item = TRAFFIC_ACCIDENT_CASES.find((entry) => entry.id === caseId) || TRAFFIC_ACCIDENT_CASES[0];
    if (!modal || !item) return;
    const isOpen = item.status === 'open';
    modal.dataset.activeAccident = item.id;
    modal.dataset.accidentStatus = item.status;
    modal.querySelector('[data-accident-tag]').textContent = `${item.id} · ${isOpen ? 'CHƯA XỬ LÝ' : 'ĐÃ XỬ LÝ'}`;
    modal.querySelector('[data-accident-title]').textContent = item.title;
    modal.querySelector('[data-accident-camera]').textContent = item.camera;
    modal.querySelector('[data-accident-time]').textContent = item.time;
    modal.querySelector('[data-accident-location]').textContent = item.location;
    modal.querySelector('[data-accident-summary]').textContent = item.summary;
    modal.querySelector('[data-accident-metrics]').innerHTML = item.metrics
      .map(([value, label]) => `<span><b>${value}</b><em>${label}</em></span>`)
      .join('');
    modal.querySelector('[data-accident-timeline]').innerHTML = item.timeline
      .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
      .join('');
    modal.querySelector('[data-accident-status-text]').textContent = isOpen
      ? `${item.location}: chưa xử lý, có thể xem lại camera và điều phối xử lý.`
      : `${item.location}: đã xử lý, camera lưu clip để đối soát.`;
    modal.querySelector('[data-accident-resolve]').hidden = !isOpen;
    modal.querySelector('[data-accident-feed]').classList.remove('traffic-accident-feed--playing');
    modal.hidden = false;
  };

  const refreshAccidentStats = () => {
    const root = document.querySelector('[data-traffic-accidents]');
    if (!root) return;
    const cases = [...root.querySelectorAll('[data-accident-case]')];
    const totals = {
      all: cases.length,
      open: cases.filter((item) => item.dataset.accidentStatus === 'open').length,
      done: cases.filter((item) => item.dataset.accidentStatus === 'done').length,
    };
    Object.entries(totals).forEach(([key, value]) => {
      root.querySelector(`.traffic-accident-stat--${key} b`)?.replaceChildren(String(value));
    });
  };

  document.addEventListener('click', (event) => {
    const accidentFilter = event.target.closest('[data-accident-filter]');
    if (accidentFilter) {
      const root = accidentFilter.closest('[data-traffic-accidents]');
      if (!root) return;
      const filter = accidentFilter.dataset.accidentFilter;
      root.querySelectorAll('[data-accident-filter]').forEach((btn) => btn.classList.toggle('traffic-kpi-action--active', btn === accidentFilter));
      root.querySelectorAll('[data-accident-case]').forEach((btn) => {
        btn.hidden = filter !== 'all' && btn.dataset.accidentStatus !== filter;
      });
      return;
    }

    const accidentCase = event.target.closest('[data-accident-case]');
    if (accidentCase) {
      setAccidentCase(getAccidentModal(), accidentCase.dataset.accidentCase);
      return;
    }

    const accidentModal = document.querySelector('[data-traffic-accident-modal]:not([hidden])');
    if (accidentModal) {
      if (event.target.closest('[data-accident-close]')) {
        accidentModal.hidden = true;
        return;
      }
      if (event.target.closest('[data-accident-review]')) {
        const item = TRAFFIC_ACCIDENT_CASES.find((entry) => entry.id === accidentModal.dataset.activeAccident) || TRAFFIC_ACCIDENT_CASES[0];
        accidentModal.querySelector('[data-accident-status-text]').textContent = `Đang phát lại đoạn camera ${item.camera} lúc ${item.time}; clip đã ghim theo hồ sơ ${item.id}.`;
        accidentModal.querySelector('[data-accident-feed]').classList.add('traffic-accident-feed--playing');
        return;
      }
      if (event.target.closest('[data-accident-resolve]')) {
        const item = TRAFFIC_ACCIDENT_CASES.find((entry) => entry.id === accidentModal.dataset.activeAccident) || TRAFFIC_ACCIDENT_CASES[0];
        item.status = 'done';
        accidentModal.dataset.accidentStatus = 'done';
        accidentModal.querySelector('[data-accident-tag]').textContent = `${item.id} · ĐÃ XỬ LÝ`;
        accidentModal.querySelector('[data-accident-status-text]').textContent = `Đã điều phối xử lý ${item.id}, hiện trường đang được giải phóng và clip camera đã lưu.`;
        accidentModal.querySelector('[data-accident-resolve]').hidden = true;
        const caseButton = document.querySelector(`[data-accident-case="${item.id}"]`);
        if (caseButton) {
          caseButton.dataset.accidentStatus = 'done';
          caseButton.classList.remove('traffic-accident-case--open');
          caseButton.classList.add('traffic-accident-case--done');
          caseButton.querySelector('strong').textContent = 'Đã xử lý';
        }
        refreshAccidentStats();
        return;
      }
    }

    const root = event.target.closest('[data-traffic-kpi]');
    if (!root) return;

    const modeBtn = event.target.closest('[data-kpi-mode]');
    const barBtn = event.target.closest('[data-kpi-bar]');
    const summary = root.querySelector('[data-traffic-kpi-summary]');
    if (!summary) return;

    if (modeBtn) {
      root.querySelectorAll('[data-kpi-mode]').forEach((btn) => btn.classList.toggle('traffic-kpi-action--active', btn === modeBtn));
      const mode = modeBtn.dataset.kpiMode;
      root.querySelectorAll('[data-kpi-bar]').forEach((bar) => {
        const label = bar.dataset.kpiBar;
        const active = mode === 'overview'
          || (mode === 'signal' && ['Tốc', 'Đèn', 'SLA'].includes(label))
          || (mode === 'camera' && ['Camera', 'Làn', 'SLA'].includes(label));
        bar.classList.toggle('traffic-kpi-bar--muted', !active);
      });
      summary.innerHTML = `<b>${modeBtn.textContent.trim()}</b><span>${modeBtn.dataset.kpiNote}</span>`;
    }

    if (barBtn) {
      const value = barBtn.querySelector('b')?.textContent || '';
      summary.innerHTML = `<b>${value}</b><span>${barBtn.dataset.kpiBar}: nhấn bộ lọc để khoanh vùng nhóm liên quan.</span>`;
    }
  });
}

export function bindTrafficFlowControls() {
  if (document.documentElement.dataset.trafficFlowBound === 'true') return;
  document.documentElement.dataset.trafficFlowBound = 'true';

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-flow-tab]');
    if (!tab) return;
    const tabs = tab.closest('[data-traffic-flow-tabs]');
    const block = tab.closest('.hud-block');
    const chart = block?.querySelector('[data-traffic-flow-chart]');
    if (!tabs || !chart) return;

    const datasets = JSON.parse(decodeURIComponent(tabs.dataset.flowDatasets || '%7B%7D'));
    const stats = datasets[tab.dataset.flowTab] || [];
    if (!stats.length) return;

    tabs.querySelectorAll('[data-flow-tab]').forEach((btn) => btn.classList.toggle('hud-tab--active', btn === tab));
    chart.dataset.flowMode = tab.dataset.flowTab;
    const nextChart = buildFlowArea(stats);
    chart.querySelector('.traffic-flow-area__fill').setAttribute('points', nextChart.area);
    chart.querySelector('.traffic-flow-area__line').setAttribute('points', nextChart.line);
    chart.querySelector('[data-flow-points]').innerHTML = nextChart.nodes;
  });
}

export function bindTrafficSignalControls() {
  if (document.documentElement.dataset.trafficSignalBound === 'true') return;
  document.documentElement.dataset.trafficSignalBound = 'true';

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-signal-tab]');
    if (!tab) return;
    const tabs = tab.closest('[data-traffic-signal-tabs]');
    const block = tab.closest('.hud-block');
    const signal = block?.querySelector('[data-traffic-signal]');
    if (!tabs || !signal) return;

    const datasets = JSON.parse(decodeURIComponent(tabs.dataset.signalDatasets || '%7B%7D'));
    const state = datasets[tab.dataset.signalTab];
    if (!state) return;

    tabs.querySelectorAll('[data-signal-tab]').forEach((btn) => btn.classList.toggle('hud-tab--active', btn === tab));
    signal.dataset.signalMode = tab.dataset.signalTab;
    signal.querySelector('[data-signal-ring]').innerHTML = ringSvg(state.pct, state.label);
    signal.querySelector('.traffic-cycle__bars').innerHTML = state.metrics.map((m) => `<span class="traffic-cycle-bar" data-signal-metric>
      <em>${m.label}</em><i style="width:${m.pct}%"></i><b>${m.value}</b>
    </span>`).join('');
  });
}
