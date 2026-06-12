import { hudHead } from './hud-charts.js';
import { addOperationalReport, updateOperationalReport } from '../data/stadium-report-store.js';

function reportDisplayId(sequence = { number: 1, year: new Date().getFullYear() }) {
  const normalized = typeof sequence === 'number'
    ? { number: sequence, year: new Date().getFullYear() }
    : sequence;
  return `BC-0${normalized.number}-${normalized.year}`;
}

function reportYear(item, fallbackYear = new Date().getFullYear()) {
  if (!item?.createdAt) return fallbackYear;
  const year = new Date(item.createdAt).getFullYear();
  return Number.isFinite(year) ? year : fallbackYear;
}

function reportSequences(items = []) {
  const fallbackYear = new Date().getFullYear();
  const countsByYear = new Map();
  const sequences = Array(items.length);
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const year = reportYear(items[index], fallbackYear);
    const next = (countsByYear.get(year) || 0) + 1;
    countsByYear.set(year, next);
    sequences[index] = { number: next, year };
  }
  return sequences;
}

function reportPhase(item) {
  if (item.resolved) return 'resolved';
  if (/đang/i.test(item.status || '')) return 'processing';
  return 'open';
}

function reportTone(item) {
  const phase = reportPhase(item);
  if (phase === 'resolved') return 'ok';
  if (phase === 'processing') return 'warn';
  return 'danger';
}

function displayReport(item, sequence = { number: 1, year: new Date().getFullYear() }) {
  const sourceId = item.sourceId || item.id;
  const displayId = item.displayId || reportDisplayId(sequence);
  return { ...item, id: displayId, displayId, sourceId, tone: reportTone(item) };
}

function historyItem(item, compact = false) {
  const display = displayReport(item);
  return `
    <div class="report-history__item report-history__item--${display.tone}">
      <div>
        <strong>${display.id}</strong>
        <span>${display.title}</span>
      </div>
      <em>${display.time}</em>
      <b>${display.status}${display.source ? ` · ${display.source}` : ''}</b>
      ${compact ? '' : '<small>Nạp từ lịch sử báo cáo vận hành VOC</small>'}
    </div>
  `;
}

const reportCaseUi = {
  crowd: {
    icon: 'ti-users-group',
    title: 'Giải quyết quá tải khán đài',
    route: ['An ninh', 'Cổng B2', 'Khán đài B'],
    metrics: [['Mật độ', 'Cao'], ['Tổ phản ứng', '2'], ['ETA', '4 ph']],
    primary: 'Kích hoạt phân luồng',
  },
  medical: {
    icon: 'ti-first-aid-kit',
    title: 'Điều phối hỗ trợ y tế',
    route: ['Y tế', 'EMS-02', 'Cổng A'],
    metrics: [['Cáng', 'Thiếu'], ['EMS', 'Sẵn sàng'], ['ETA', '3 ph']],
    primary: 'Điều EMS',
  },
  power: {
    icon: 'ti-bolt',
    title: 'Khôi phục nguồn điện',
    route: ['BMS', 'UPS phụ', 'Kiosk C2'],
    metrics: [['Tải', 'Ổn định'], ['UPS', 'Online'], ['Rủi ro', 'Thấp']],
    primary: 'Xác nhận khôi phục',
  },
  fire: {
    icon: 'ti-flame',
    title: 'Xử lý báo cháy / khói',
    route: ['PCCC', 'Bếp B', 'Cảm biến khói'],
    metrics: [['Khói', 'Dao động'], ['Gas', 'Cần khóa'], ['PCCC', 'Ưu tiên']],
    primary: 'Chuyển PCCC xử lý',
  },
  'fire-risk': {
    icon: 'ti-alert-triangle',
    title: 'Xử lý nguy cơ cháy nổ',
    route: ['Kỹ thuật', 'Tủ điện C4', 'CO2 standby'],
    metrics: [['Nhiệt', 'Tăng'], ['Tải', 'Cao'], ['Rủi ro', 'Cần giảm']],
    primary: 'Giảm tải & kiểm tra',
  },
  traffic: {
    icon: 'ti-traffic-lights',
    title: 'Điều tiết giao thông',
    route: ['P4', 'Làn P3', 'LED'],
    metrics: [['Hàng chờ', 'Cao'], ['Làn mở', '1'], ['ETA', '5 ph']],
    primary: 'Mở phương án P3',
  },
};

function reportHistoryCase(item) {
  const display = displayReport(item);
  const action = display.resolved
    ? '<span class="report-case__closed"><i class="ti ti-check"></i>Đã đóng</span>'
    : `<button type="button" class="report-case__resolve" data-report-resolve="${display.sourceId}">
        <i class="ti ti-tool"></i><span>Giải quyết</span>
      </button>`;
  const escalation = !display.resolved && display.attempts >= 2
    ? `<button type="button" class="report-case__escalate" data-report-escalate="${display.sourceId}">
        <i class="ti ti-message-report"></i><span>Khiếu nại phụ trách</span>
      </button>`
    : '';
  return `<article class="report-case report-case--${display.tone}" data-report-case="${display.sourceId}" data-report-resolved="${display.resolved ? 'true' : 'false'}">
    <div class="report-case__main">
      <small>${display.id} · ${display.time}</small>
      <strong>${display.title}</strong>
      <p>${display.summary}</p>
    </div>
    <div class="report-case__meta">
      <span class="report-case__attempt">Lần ${display.attempts}</span>
      <span>${display.owner}</span>
      <b>${display.status}</b>
    </div>
    <div class="report-case__actions">
      ${action}
      ${escalation}
    </div>
    <div class="report-case__status" data-report-case-status></div>
  </article>`;
}

function reportCaseList(items = [], filter = 'all') {
  const filtered = items.filter((item) => {
    const phase = reportPhase(item);
    if (filter === 'open') return phase === 'open';
    if (filter === 'processing') return phase === 'processing';
    if (filter === 'resolved') return phase === 'resolved';
    return true;
  });
  if (!filtered.length) return '<div class="report-history-modal__empty">Không có báo cáo trong nhóm này.</div>';
  return filtered.map(reportHistoryCase).join('');
}

function reportResolveModal(items = []) {
  const payload = encodeURIComponent(JSON.stringify(items));
  return `<div class="report-resolve-modal" data-report-resolve-modal data-report-cases="${payload}" hidden>
    <div class="report-resolve-modal__panel" role="dialog" aria-modal="true" aria-label="Giải quyết báo cáo">
      <button type="button" class="report-send-modal__close" data-report-resolve-close aria-label="Đóng">
        <i class="ti ti-x"></i>
      </button>
      <div class="report-send-modal__head">
        <span><i class="ti ti-tool" data-report-resolve-icon></i></span>
        <div>
          <small data-report-resolve-tag>Luồng xử lý</small>
          <h3 data-report-resolve-title>Giải quyết báo cáo</h3>
          <p data-report-resolve-summary></p>
        </div>
      </div>
      <div class="report-resolve-modal__route" data-report-resolve-route></div>
      <div class="report-resolve-modal__metrics" data-report-resolve-metrics></div>
      <div class="report-resolve-modal__steps" data-report-resolve-steps></div>
      <div class="report-resolve-modal__status" data-report-resolve-status>Chưa kích hoạt thao tác xử lý.</div>
      <button type="button" class="report-send-modal__primary" data-report-resolve-confirm>
        <i class="ti ti-send"></i><span data-report-resolve-primary>Xác nhận xử lý</span>
      </button>
    </div>
  </div>`;
}

function reportSummaryViz(reportCases = []) {
  const total = reportCases.length;
  const closed = reportCases.filter((item) => item.resolved).length;
  const open = Math.max(total - closed, 0);
  const pct = total ? Math.round((closed / total) * 100) : 0;
  return `<div class="report-summary-viz">
    <div class="report-summary-viz__ring" style="--pct:${pct}">
      <strong>${total}</strong><span>Báo cáo</span>
    </div>
    <div class="report-summary-viz__chips">
      <span><b>${closed}</b><em>Đã đóng</em></span>
      <span class="report-summary-viz__warn"><b>${open}</b><em>Theo dõi</em></span>
    </div>
  </div>`;
}

function reportTimeline(items = []) {
  return `<div class="report-timeline">${items.map((item) => `
    <button type="button" class="report-timeline__node report-timeline__node--${reportTone(item)}" title="${item.title}" data-report-history-open aria-label="Xem lịch sử báo cáo ${item.id}">
      <i></i><strong>${item.time}</strong><span>${item.id}</span><b>${item.status}</b>
    </button>
  `).join('')}</div>`;
}

function reportResolutionViz(items = []) {
  const colors = ['#18d8f5', '#2f8cff', '#00c2ff'];
  return `<div class="report-resolution-viz">${items.map((item, index) => `
    <div class="report-gauge" style="--bar-color:${colors[index] || '#18d8f5'};--bar-pct:${item.value}">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="30"></circle>
        <circle cx="40" cy="40" r="30"></circle>
      </svg>
      <strong>${item.value}%</strong>
      <span>L${index + 1}</span>
    </div>
  `).join('')}</div>`;
}

function incidentMatrix(items = []) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const blues = ['#18d8f5', '#2f8cff', '#00a6d6', '#41e4ff', '#2467c9'];
  const stops = items.map((item, index) => {
    const prev = items.slice(0, index).reduce((sum, row) => sum + row.value, 0) / total * 100;
    const next = prev + (item.value / total * 100);
    return `${blues[index] || '#18d8f5'} ${prev}% ${next}%`;
  }).join(', ');
  return `<div class="report-incident-viz">
    <div class="report-incident-viz__donut" style="--segments:${stops}"><strong>${total}%</strong><span>Mix</span></div>
    <div class="report-incident-viz__grid">${items.map((item, index) => `
      <span style="--bar-color:${blues[index] || '#18d8f5'};--bar-pct:${item.value}%">
        <em>${item.label}</em><i></i><b>${item.value}%</b>
      </span>
    `).join('')}</div>
  </div>`;
}

function reportOverviewMap() {
  return `<div class="report-overview-viz">
    <div class="report-overview-map">
      <div class="report-overview-side report-overview-side--left">
        <span><b>20:14</b><em>Báo cáo mới</em></span>
        <span><b>VOC</b><em>Online</em></span>
      </div>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="report-overview-map__ring" cx="50" cy="50" r="24"/>
        <circle class="report-overview-map__core" cx="50" cy="50" r="8"/>
        ${[0, 60, 120, 180, 240, 300].map((deg, index) => {
    const rad = (deg - 90) * Math.PI / 180;
    const x = 50 + Math.cos(rad) * 34;
    const y = 50 + Math.sin(rad) * 34;
    const tone = index % 2 ? 'ok' : 'hot';
    return `<line class="report-overview-map__line" x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>
      <circle class="report-overview-map__node report-overview-map__node--${tone}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.6"/>`;
      }).join('')}
      </svg>
      <div class="report-overview-side report-overview-side--right">
        <span><b>5</b><em>Theo dõi</em></span>
        <span><b>4</b><em>Ưu tiên</em></span>
      </div>
    </div>
  </div>`;
}

function reportSensorChart() {
  const bars = [
    { label: 'Nhiệt', value: 82, tone: 'cyan' },
    { label: 'Khói', value: 64, tone: 'blue' },
    { label: 'Gas', value: 38, tone: 'cyan' },
    { label: 'Điện', value: 52, tone: 'blue' },
  ];
  return `<div class="report-overview-chart">
      <div class="report-overview-chart__note">
        <span><b>97%</b><em>Closed-loop</em></span>
        <span><b>12m</b><em>TB xử lý</em></span>
      </div>
      <div class="report-overview-bars">${bars.map((bar) => `
        <div class="report-overview-bar report-overview-bar--${bar.tone}">
          <span>${bar.label}</span><i style="height:${bar.value}%"></i><b>${bar.value}%</b>
        </div>
      `).join('')}</div>
      <div class="report-overview-chart__note">
        <span><b>B</b><em>Điểm nóng</em></span>
        <span><b>C2</b><em>Điện</em></span>
      </div>
  </div>`;
}

function reportSendForm(reportCases = []) {
  const total = reportCases.length;
  const open = reportCases.filter((item) => !item.resolved).length;
  const closed = total - open;
  const closedPct = total ? Math.round((closed / total) * 100) : 0;
  return `<div class="report-send">
    <div class="report-send-flow" aria-hidden="true">
      <span><i class="ti ti-database"></i><b>VOC</b><em>Dữ liệu ca</em></span>
      <i></i>
      <span><i class="ti ti-chart-bar"></i><b>${total}</b><em>Báo cáo</em></span>
      <i></i>
      <span><i class="ti ti-file-export"></i><b>Xuất</b><em>Tổng hợp</em></span>
      <i></i>
      <span><i class="ti ti-send"></i><b>Cấp trên</b><em>Chờ gửi</em></span>
    </div>
    <div class="report-send__summary">
      <span><b>${total}</b><em>Báo cáo</em></span>
      <span><b>${open}</b><em>Cần theo dõi</em></span>
      <span><b>${closedPct}%</b><em>Closed-loop</em></span>
    </div>
    <button type="button" class="report-send__btn" data-report-send-open>
      <i class="ti ti-send"></i><span>Gửi báo cáo</span>
    </button>
    <div class="report-send__status" data-report-send-status>Chưa gửi báo cáo tổng hợp.</div>
  </div>
  <div class="report-send-modal" data-report-send-modal hidden>
    <div class="report-send-modal__panel" role="dialog" aria-modal="true" aria-label="Gửi báo cáo cấp trên">
      <button type="button" class="report-send-modal__close" data-report-send-close aria-label="Đóng">
        <i class="ti ti-x"></i>
      </button>
      <div class="report-send-modal__head">
        <span><i class="ti ti-file-export"></i></span>
        <div>
          <small>Báo cáo vận hành</small>
          <h3>Gửi báo cáo cấp trên</h3>
        </div>
      </div>
      <div class="report-send-modal__grid">
        <label><span>Gửi tới</span>
          <select data-report-recipient>
            <option>Giám đốc vận hành</option>
            <option>Ban giám đốc</option>
            <option>Trưởng ban an toàn</option>
            <option>Cấp trên VOC</option>
          </select>
        </label>
        <label><span>Hình thức gửi</span>
          <select data-report-delivery>
            <option value="system">Gửi trực tiếp từ hệ thống</option>
            <option value="file">Xuất file và gửi</option>
          </select>
        </label>
        <label><span>Định dạng</span>
          <select data-report-format>
            <option>PDF</option>
            <option>Excel (.xlsx)</option>
            <option>PowerPoint (.pptx)</option>
            <option>Link dashboard</option>
          </select>
        </label>
        <label><span>Mức ưu tiên</span>
          <select data-report-priority>
            <option>Bình thường</option>
            <option>Ưu tiên</option>
            <option>Khẩn</option>
          </select>
        </label>
      </div>
      <div class="report-send-modal__summary">
        <span><b>${total}</b><em>Báo cáo</em></span>
        <span><b>${open}</b><em>Cần theo dõi</em></span>
        <span><b>${closedPct}%</b><em>Closed-loop</em></span>
      </div>
      <button type="button" class="report-send-modal__primary" data-report-send-confirm>
        <i class="ti ti-send"></i><span>Xác nhận gửi</span>
      </button>
    </div>
  </div>`;
}

function adviceDiagram(notes = []) {
  const icons = ['ti-users-group', 'ti-bolt', 'ti-file-check'];
  return `<div class="report-advice-viz">${notes.map((note, index) => `
    <button type="button" class="report-advice-node" title="${note}">
      <i class="ti ${icons[index] || 'ti-check'}"></i><b>0${index + 1}</b><span></span>
    </button>
  `).join('')}</div>
  <button type="button" class="report-advice__send" data-report-advice-open>
    <i class="ti ti-send"></i><span>Gửi góp ý</span>
  </button>
  <div class="report-send__status report-advice__status" data-report-advice-status>Ch&#432;a g&#7917;i g&#243;p &#253; cho ban qu&#7843;n l&#253;.</div>
  <div class="report-advice-modal" data-report-advice-modal hidden>
    <div class="report-send-modal__panel report-advice-modal__panel" role="dialog" aria-modal="true" aria-label="G&#7917;i g&#243;p &#253; cho ban qu&#7843;n l&#253;">
      <button type="button" class="report-send-modal__close" data-report-advice-close aria-label="&#272;&#243;ng">
        <i class="ti ti-x"></i>
      </button>
      <div class="report-send-modal__head">
        <span><i class="ti ti-message-report"></i></span>
        <div>
          <small>G&#243;p &#253; qu&#7843;n l&#253;</small>
          <h3>G&#7917;i g&#243;p &#253; cho ban qu&#7843;n l&#253;</h3>
        </div>
      </div>
      <div class="report-send-modal__grid">
        <label><span>Nh&#243;m g&#243;p &#253;</span>
          <select data-report-advice-topic>
            <option>Quy tr&#236;nh v&#7853;n h&#224;nh</option>
            <option>An to&#224;n kh&#225;n gi&#7843;</option>
            <option>H&#7841; t&#7847;ng - thi&#7871;t b&#7883;</option>
            <option>D&#7883;ch v&#7909; trong s&#226;n</option>
          </select>
        </label>
        <label><span>M&#7913;c &#432;u ti&#234;n</span>
          <select data-report-advice-priority>
            <option>Theo d&#245;i</option>
            <option>&#431;u ti&#234;n</option>
            <option>C&#7847;n x&#7917; l&#253; ngay</option>
          </select>
        </label>
      </div>
      <label class="report-advice-modal__note"><span>N&#7897;i dung</span>
        <textarea data-report-advice-message rows="4">&#272;&#7873; xu&#7845;t t&#7889;i &#432;u lu&#7891;ng ph&#7843;n h&#7891;i VOC sau ca v&#7853;n h&#224;nh, &#432;u ti&#234;n c&#225;c &#273;i&#7875;m n&#243;ng v&#224; nh&#243;m ch&#7881; s&#7889; c&#7843;m bi&#7871;n b&#7845;t th&#432;&#7901;ng.</textarea>
      </label>
      <div class="report-send-modal__summary">
        <span><b>03</b><em>Khuy&#7871;n ngh&#7883;</em></span>
        <span><b>01</b><em>Ca v&#7853;n h&#224;nh</em></span>
        <span><b>VOC</b><em>Ng&#432;&#7901;i nh&#7853;n</em></span>
      </div>
      <button type="button" class="report-send-modal__primary" data-report-advice-confirm>
        <i class="ti ti-send"></i><span>X&#225;c nh&#7853;n g&#7917;i g&#243;p &#253;</span>
      </button>
    </div>
  </div>`;
}

function focusMap() {
  return `<div class="report-focus-map">
    <svg viewBox="0 0 140 92" aria-hidden="true">
      <rect class="report-focus-map__field" x="34" y="18" width="72" height="46" rx="23"/>
      <path class="report-focus-map__ring" d="M14 73c26-12 88-12 112 0"/>
      <g class="report-focus-map__pin report-focus-map__pin--hot" transform="translate(76 24)">
        <circle r="8"/><text y="3">B</text>
      </g>
      <g class="report-focus-map__pin report-focus-map__pin--warn" transform="translate(104 58)">
        <circle r="8"/><text y="3">C2</text>
      </g>
      <g class="report-focus-map__pin report-focus-map__pin--ok" transform="translate(32 56)">
        <circle r="8"/><text y="3">A</text>
      </g>
    </svg>
    <div class="report-focus-map__chips">
      <span><b>38%</b><em>Khán đài B</em></span>
      <span><b>17%</b><em>Kiosk C2</em></span>
      <span><b>24%</b><em>Cổng A</em></span>
    </div>
  </div>`;
}

export function renderReportsLeft(d) {
  const rawReportCases = d.reportCases || [];
  const sequences = reportSequences(rawReportCases);
  const reportCases = rawReportCases.map((item, index) => displayReport(item, sequences[index]));
  const resolvedCount = reportCases.filter((item) => reportPhase(item) === 'resolved').length;
  const processingCount = reportCases.filter((item) => reportPhase(item) === 'processing').length;
  const openCount = reportCases.filter((item) => reportPhase(item) === 'open').length;
  const allCount = reportCases.length;

  return `
    <section class="hud-block report-summary">${hudHead('Báo cáo vận hành')}
      ${reportSummaryViz(reportCases)}
    </section>
    <section class="hud-block report-history">${hudHead('Dòng báo cáo đã gửi')}
      ${reportTimeline(reportCases.slice(0, 5))}
      <button type="button" class="report-history__more" data-report-history-open>
        <i class="ti ti-history"></i><span>Xem lịch sử</span>
      </button>
    </section>
    <section class="hud-block report-resolution">${hudHead('Tỉ lệ xử lý')}
      ${reportResolutionViz(d.resolution)}
    </section>
    <section class="hud-block report-focus">${hudHead('Điểm cần ưu tiên')}
      ${focusMap()}
    </section>
    <div class="report-history-modal" data-report-history-modal hidden>
      <div class="report-history-modal__panel" role="dialog" aria-modal="true" aria-label="Lịch sử báo cáo đã gửi">
        <button type="button" class="report-history-modal__close" data-report-history-close aria-label="Đóng">
          <i class="ti ti-x"></i>
        </button>
        <h3>Lịch sử báo cáo đã gửi</h3>
        <p>Theo dõi các báo cáo đã gửi, báo cháy, nguy cơ cháy nổ và các vấn đề còn mở trong ca vận hành.</p>
        <div class="report-history-modal__tabs" data-report-history-tabs>
          <button type="button" class="hud-tab hud-tab--active" data-report-history-tab="all">Tất cả <b>${allCount}</b></button>
          <button type="button" class="hud-tab" data-report-history-tab="open">Chưa giải quyết <b>${openCount}</b></button>
          <button type="button" class="hud-tab" data-report-history-tab="processing">Đang giải quyết <b>${processingCount}</b></button>
          <button type="button" class="hud-tab" data-report-history-tab="resolved">Đã giải quyết <b>${resolvedCount}</b></button>
        </div>
        <div class="report-history-modal__list" data-report-history-panel data-report-cases="${encodeURIComponent(JSON.stringify(reportCases))}">${reportCaseList(reportCases, 'all')}</div>
      </div>
    </div>
    ${reportResolveModal(reportCases)}
  `;
}

export function renderReportsRight(d) {
  const reportCases = d.reportCases || [];
  return `
    <section class="hud-block report-overview">${hudHead('Tổng quan báo cáo')}
      ${reportOverviewMap()}
    </section>
    <section class="hud-block report-sensors">${hudHead('Chỉ số cảm biến')}
      ${reportSensorChart()}
    </section>
    <section class="hud-block report-incident">${hudHead('Thống kê vụ việc')}
      ${incidentMatrix(d.incidentMix)}
    </section>
    <section class="hud-block report-send-block">${hudHead('Gửi báo cáo cấp trên')}
      ${reportSendForm(reportCases)}
    </section>
    <section class="hud-block report-advice">${hudHead('Góp ý cho ban quản lý')}
      ${adviceDiagram(d.managementNotes)}
    </section>
  `;
}

export function bindReportsHistory(root) {
  if (!root || root.dataset.reportHistoryBound === 'true') return;
  root.dataset.reportHistoryBound = 'true';

  const getBodyModal = (selector) => {
    const modal = root.querySelector(selector) || document.querySelector(selector);
    if (!modal) return null;
    const bodyModal = document.body.querySelector(selector);
    if (bodyModal && bodyModal !== modal) bodyModal.remove();
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    return modal;
  };

  root.addEventListener('click', (e) => {
    const modal = getBodyModal('[data-report-history-modal]');

    if (modal && e.target.closest('[data-report-history-open]')) {
      modal.hidden = false;
      return;
    }

    if (e.target.closest('[data-report-send-open]')) {
      const sendModal = getBodyModal('[data-report-send-modal]');
      if (!sendModal) return;
      sendModal.hidden = false;
      return;
    }

    if (e.target.closest('[data-report-advice-open]')) {
      const adviceModal = getBodyModal('[data-report-advice-modal]');
      if (!adviceModal) return;
      adviceModal.hidden = false;
      return;
    }

    if (false && sendModal && e.target.closest('[data-report-send-confirm]')) {
      const recipient = root.querySelector('[data-report-recipient]')?.value || 'cấp trên';
      const delivery = root.querySelector('[data-report-delivery]')?.value || 'system';
      const format = root.querySelector('[data-report-format]')?.value || 'PDF';
      const status = root.querySelector('[data-report-send-status]');
      const method = delivery === 'system' ? 'trực tiếp từ hệ thống' : `dưới định dạng ${format}`;
      if (status) status.textContent = `Đã gửi báo cáo tổng hợp tới ${recipient} ${method}.`;
      sendModal.hidden = true;
    }
  });

  document.addEventListener('click', (e) => {
    const sendModal = document.querySelector('[data-report-send-modal]:not([hidden])');
    const adviceModal = document.querySelector('[data-report-advice-modal]:not([hidden])');
    const historyModal = document.querySelector('[data-report-history-modal]');
    const openHistoryModal = document.querySelector('[data-report-history-modal]:not([hidden])');
    const resolveModalAny = document.querySelector('[data-report-resolve-modal]');
    const resolveModal = document.querySelector('[data-report-resolve-modal]:not([hidden])');
    const cases = (() => {
      try {
        return JSON.parse(decodeURIComponent(resolveModalAny?.dataset.reportCases || '%5B%5D'));
      } catch {
        return [];
      }
    })();

    if (openHistoryModal && (e.target.closest('[data-report-history-close]') || e.target === openHistoryModal)) {
      openHistoryModal.hidden = true;
      return;
    }

    const historyTab = e.target.closest('[data-report-history-tab]');
    if (openHistoryModal && historyTab) {
      openHistoryModal.querySelectorAll('[data-report-history-tab]').forEach((tab) => {
        tab.classList.toggle('hud-tab--active', tab === historyTab);
      });
      const panel = openHistoryModal.querySelector('[data-report-history-panel]');
      if (panel) {
        const items = JSON.parse(decodeURIComponent(panel.dataset.reportCases || '%5B%5D'));
        panel.innerHTML = reportCaseList(items, historyTab.dataset.reportHistoryTab);
      }
      return;
    }

    const escalateBtn = e.target.closest('[data-report-escalate]');
    if (openHistoryModal && escalateBtn) {
      const card = openHistoryModal.querySelector(`[data-report-case="${escalateBtn.dataset.reportEscalate}"]`);
      const item = cases.find((entry) => (entry.sourceId || entry.id) === escalateBtn.dataset.reportEscalate);
      const status = card?.querySelector('[data-report-case-status]');
      if (status && item) {
        status.textContent = `Đã gửi khiếu nại tới ${item.owner}; yêu cầu phản hồi trước mốc SLA tiếp theo.`;
        status.hidden = false;
        addOperationalReport({
          title: `Khiếu nại phụ trách: ${item.title}`,
          summary: `Đã gửi khiếu nại tới ${item.owner} cho báo cáo ${item.displayId || item.id}.`,
          steps: ['Ghi nhận khiếu nại', 'Gửi người phụ trách', 'Theo dõi phản hồi SLA'],
          type: item.type,
          tone: 'warn',
          owner: item.owner,
          status: 'Chưa giải quyết',
        });
      }
      escalateBtn.disabled = true;
      escalateBtn.querySelector('span').textContent = 'Đã khiếu nại';
      return;
    }

    const resolveBtn = e.target.closest('[data-report-resolve]');
    if (openHistoryModal && resolveModalAny && resolveBtn) {
      if (resolveModalAny.parentElement !== document.body) document.body.appendChild(resolveModalAny);
      const item = cases.find((entry) => (entry.sourceId || entry.id) === resolveBtn.dataset.reportResolve);
      const ui = reportCaseUi[item?.type] || reportCaseUi.crowd;
      if (!item) return;
      resolveModalAny.dataset.activeCase = item.sourceId || item.id;
      resolveModalAny.querySelector('[data-report-resolve-icon]').className = `ti ${ui.icon}`;
      resolveModalAny.querySelector('[data-report-resolve-tag]').textContent = `${item.displayId || item.id} · Lần ${item.attempts}`;
      resolveModalAny.querySelector('[data-report-resolve-title]').textContent = ui.title;
      resolveModalAny.querySelector('[data-report-resolve-summary]').textContent = item.summary;
      resolveModalAny.querySelector('[data-report-resolve-primary]').textContent = ui.primary;
      resolveModalAny.querySelector('[data-report-resolve-status]').textContent = 'Chưa kích hoạt thao tác xử lý.';
      resolveModalAny.querySelector('[data-report-resolve-route]').innerHTML = ui.route
        .map((step, index) => `${index ? '<i></i>' : ''}<span>${step}</span>`)
        .join('');
      resolveModalAny.querySelector('[data-report-resolve-metrics]').innerHTML = ui.metrics
        .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
        .join('');
      resolveModalAny.querySelector('[data-report-resolve-steps]').innerHTML = item.steps
        .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
        .join('');
      resolveModalAny.hidden = false;
      return;
    }

    if (resolveModal && (e.target.closest('[data-report-resolve-close]') || e.target === resolveModal)) {
      resolveModal.hidden = true;
      return;
    }

    if (resolveModal && e.target.closest('[data-report-resolve-confirm]')) {
      const id = resolveModal.dataset.activeCase;
      const card = historyModal?.querySelector(`[data-report-case="${id}"]`);
      const status = card?.querySelector('[data-report-case-status]');
      const resolveButton = card?.querySelector('[data-report-resolve]');
      if (status) {
        status.textContent = 'Đã kích hoạt luồng xử lý; chờ xác nhận đóng báo cáo từ người phụ trách.';
        status.hidden = false;
      }
      if (resolveButton) {
        resolveButton.disabled = true;
        resolveButton.querySelector('span').textContent = 'Đang giải quyết';
      }
      resolveModal.querySelector('[data-report-resolve-status]').textContent = 'Đã gửi thao tác xử lý tới bộ phận phụ trách.';
      updateOperationalReport(id, {
        status: 'Đang giải quyết',
        resolved: false,
        tone: 'warn',
      });
      return;
    }

    if (sendModal && (e.target.closest('[data-report-send-close]') || e.target === sendModal)) {
      sendModal.hidden = true;
      return;
    }

    if (sendModal && e.target.closest('[data-report-send-confirm]')) {
      const recipient = sendModal.querySelector('[data-report-recipient]')?.value || 'c\u1ea5p tr\u00ean';
      const delivery = sendModal.querySelector('[data-report-delivery]')?.value || 'system';
      const format = sendModal.querySelector('[data-report-format]')?.value || 'PDF';
      const status = root.querySelector('[data-report-send-status]');
      const method = delivery === 'system'
        ? 'tr\u1ef1c ti\u1ebfp t\u1eeb h\u1ec7 th\u1ed1ng'
        : `d\u01b0\u1edbi \u0111\u1ecbnh d\u1ea1ng ${format}`;
      if (status) status.textContent = `\u0110\u00e3 g\u1eedi b\u00e1o c\u00e1o t\u1ed5ng h\u1ee3p t\u1edbi ${recipient} ${method}.`;
      addOperationalReport({
        title: 'Gửi báo cáo tổng hợp ca vận hành',
        summary: `Đã gửi báo cáo tổng hợp tới ${recipient} ${method}.`,
        steps: ['Tổng hợp dữ liệu VOC', `Xuất ${format}`, `Gửi tới ${recipient}`],
        type: 'crowd',
        tone: 'ok',
        resolved: true,
        owner: recipient,
        status: 'Đã gửi',
      });
      sendModal.hidden = true;
      return;
    }

    if (adviceModal && (e.target.closest('[data-report-advice-close]') || e.target === adviceModal)) {
      adviceModal.hidden = true;
      return;
    }

    if (adviceModal && e.target.closest('[data-report-advice-confirm]')) {
      const topic = adviceModal.querySelector('[data-report-advice-topic]')?.value || 'g\u00f3p \u00fd';
      const priority = adviceModal.querySelector('[data-report-advice-priority]')?.value || 'theo d\u00f5i';
      const status = root.querySelector('[data-report-advice-status]');
      if (status) status.textContent = `\u0110\u00e3 g\u1eedi g\u00f3p \u00fd "${topic}" v\u1edbi m\u1ee9c ${priority} t\u1edbi ban qu\u1ea3n l\u00fd.`;
      addOperationalReport({
        title: `Góp ý ban quản lý: ${topic}`,
        summary: `Đã gửi góp ý "${topic}" với mức ${priority} tới ban quản lý.`,
        steps: ['Ghi nhận nội dung góp ý', 'Gửi ban quản lý', 'Theo dõi phản hồi sau ca'],
        type: 'crowd',
        tone: priority.includes('ngay') || priority.includes('Ưu') ? 'warn' : 'ok',
        resolved: true,
        owner: 'Ban quản lý sân',
        status: 'Đã gửi',
      });
      adviceModal.hidden = true;
    }
  });
}
