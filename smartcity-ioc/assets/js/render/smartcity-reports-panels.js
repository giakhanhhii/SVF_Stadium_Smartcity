// Panel + modal trang Reports (báo cáo vận hành). Tách từ smartcity-domain-command-panels.js.
import {
  smartReportCases,
  trafficViolationDetails,
  reportIncidentDetails,
} from '../data/smartcity-domain-panels-data.js';
import { hudHead } from '../../../../shared-ioc/assets/js/render/hud-primitives.js';

export function reportSummary({ slaPct, chips }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="report-summary">
    ${hudHead('Báo cáo vận hành')}
    <div class="sc-report-summary">
      <div class="sc-report-summary__ring" style="--pct:${slaPct}"><strong>${slaPct}%</strong><span>SLA đô thị</span></div>
      <div class="sc-report-summary__chips">
        ${chips.map((chip) => `<span${chip.warn ? ' class="sc-report-summary__warn"' : ''}><b>${chip.value}</b><em>${chip.label}</em></span>`).join('\n        ')}
      </div>
    </div>
  </section>`;
}

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

export function reportTimeline({ items }) {
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

export function reportResolution({ points }) {
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

export function reportIncidentMatrix({ items }) {
  return `<section class="hud-block sc-diagram" data-diagram-family="incident-matrix">
    ${hudHead('Ma trận cảnh báo an ninh')}
    <div class="sc-incident-matrix">
      ${items.map((item, index) => `<span style="--pct:${item.value}%">
        <em>${item.label}</em><i></i><b>${item.value}%</b>
      </span>`).join('')}
    </div>
  </section>`;
}

export function reportOverviewMap({ kpis }) {
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
        ${kpis.map((kpi) => `<span><b>${kpi.value}</b><em>${kpi.label}</em></span>`).join('\n        ')}
      </div>
    </div>
  </section>`;
}

export function smartcityReportSendCard({ steps, summary }) {
  return `<section class="hud-block sc-diagram smart-report-submit" data-diagram-family="smart-report-submit">
    ${hudHead('Gửi báo cáo cấp trên')}
    <div class="smart-report-submit__flow" aria-hidden="true">
      ${steps.map(([label, sub, icon]) => `<span><i class="ti ${icon}"></i><b>${label}</b><em>${sub}</em></span>`).join('')}
    </div>
    <div class="smart-report-submit__summary">
      ${summary.map(([value, label]) => `<span><b>${value}</b><em>${label}</em></span>`).join('\n      ')}
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
          ${summary.map(([value, label]) => `<span><b>${value}</b><em>${label}</em></span>`).join('\n          ')}
        </div>
        <button type="button" class="smart-report-submit-modal__primary" data-smart-report-send-confirm>
          <i class="ti ti-send"></i><span>Xác nhận gửi</span>
        </button>
      </div>
    </div>
  </section>`;
}

export function smartcityManagementAdviceCard({ notes }) {
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

export function reportSensorChart({ bars }) {
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
