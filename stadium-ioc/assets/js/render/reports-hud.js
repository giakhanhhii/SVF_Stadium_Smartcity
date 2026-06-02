import { hudHead } from './hud-charts.js';

function historyItem(item, compact = false) {
  return `
    <div class="report-history__item report-history__item--${item.tone}">
      <div>
        <strong>${item.id}</strong>
        <span>${item.title}</span>
      </div>
      <em>${item.time}</em>
      <b>${item.status}${item.source ? ` · ${item.source}` : ''}</b>
      ${compact ? '' : '<small>Nạp từ lịch sử báo cáo vận hành VOC</small>'}
    </div>
  `;
}

function reportSummaryViz() {
  return `<div class="report-summary-viz">
    <div class="report-summary-viz__ring" style="--pct:88">
      <strong>42</strong><span>Báo cáo</span>
    </div>
    <div class="report-summary-viz__chips">
      <span><b>37</b><em>Đã đóng</em></span>
      <span class="report-summary-viz__warn"><b>5</b><em>Theo dõi</em></span>
    </div>
  </div>`;
}

function reportTimeline(items = []) {
  return `<div class="report-timeline">${items.map((item) => `
    <button type="button" class="report-timeline__node report-timeline__node--${item.tone}" title="${item.title}">
      <i></i><strong>${item.time}</strong><span>${item.id.replace('BC-2405-', '#')}</span><b>${item.status}</b>
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

function reportSendForm() {
  return `<div class="report-send">
    <div class="report-send-flow" aria-hidden="true">
      <span><i class="ti ti-database"></i><b>VOC</b><em>Dữ liệu ca</em></span>
      <i></i>
      <span><i class="ti ti-chart-bar"></i><b>42</b><em>Báo cáo</em></span>
      <i></i>
      <span><i class="ti ti-file-export"></i><b>Xuất</b><em>Tổng hợp</em></span>
      <i></i>
      <span><i class="ti ti-send"></i><b>Cấp trên</b><em>Chờ gửi</em></span>
    </div>
    <div class="report-send__summary">
      <span><b>42</b><em>Báo cáo</em></span>
      <span><b>5</b><em>Cần theo dõi</em></span>
      <span><b>97%</b><em>Closed-loop</em></span>
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
        <span><b>42</b><em>Báo cáo</em></span>
        <span><b>5</b><em>Cần theo dõi</em></span>
        <span><b>97%</b><em>Closed-loop</em></span>
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
  const fullHistory = [...d.history, ...(d.simulatedHistory || [])]
    .map((item) => historyItem(item))
    .join('');

  return `
    <section class="hud-block report-summary">${hudHead('Báo cáo vận hành')}
      ${reportSummaryViz()}
    </section>
    <section class="hud-block report-history">${hudHead('Dòng báo cáo đã gửi')}
      ${reportTimeline(d.history)}
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
        <button type="button" class="report-history-modal__clear" data-report-history-clear>
          <i class="ti ti-trash"></i><span>Xóa toàn bộ lịch sử</span>
        </button>
        <h3>Lịch sử báo cáo đã gửi</h3>
        <p>Lịch sử thật được nạp từ hệ thống VOC; 3 dòng giả lập dùng để mô phỏng dữ liệu mở rộng.</p>
        <div class="report-history-modal__list" data-report-history-full>${fullHistory}</div>
        <div class="report-history-modal__empty" data-report-history-empty hidden>Chưa có lịch sử báo cáo trong phiên này.</div>
      </div>
    </div>
  `;
}

export function renderReportsRight(d) {
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
      ${reportSendForm()}
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
    const modal = root.querySelector('[data-report-history-modal]');

    if (modal && e.target.closest('[data-report-history-open]')) {
      modal.hidden = false;
      return;
    }

    if (modal && (e.target.closest('[data-report-history-close]') || e.target === modal)) {
      modal.hidden = true;
      return;
    }

    if (modal && e.target.closest('[data-report-history-clear]')) {
      const list = modal.querySelector('[data-report-history-full]');
      const empty = modal.querySelector('[data-report-history-empty]');
      if (list) list.innerHTML = '';
      if (empty) empty.hidden = false;
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
      adviceModal.hidden = true;
    }
  });
}
