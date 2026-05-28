import { hudHead } from './hud-charts.js';

function pctBar(item, className = 'report-hud__bar') {
  return `<div class="${className}" style="--bar-color:${item.color};--bar-pct:${item.value}%">
    <div class="${className}-head"><span>${item.label}</span><strong>${item.value}%</strong></div>
    <div class="${className}-track"><span></span></div>
  </div>`;
}

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

export function renderReportsLeft(d) {
  const history = d.history.map((item) => historyItem(item, true)).join('');
  const fullHistory = [...d.history, ...(d.simulatedHistory || [])]
    .map((item) => historyItem(item))
    .join('');

  return `
    <section class="hud-block report-summary">${hudHead('Báo cáo vận hành')}
      <div class="report-summary__metric"><span>Tổng báo cáo</span><strong>42</strong></div>
      <div class="report-summary__split">
        <div><span>Đã đóng</span><strong>37</strong></div>
        <div><span>Đang theo dõi</span><strong>5</strong></div>
      </div>
    </section>
    <section class="hud-block report-history">${hudHead('Lịch sử báo cáo đã gửi')}
      <div class="report-history__list">${history}</div>
      <button type="button" class="report-history__more" data-report-history-open>
        <i class="ti ti-history"></i><span>Xem thêm lịch sử</span>
      </button>
    </section>
    <section class="hud-block report-resolution">${hudHead('Tỉ lệ xử lý')}
      ${d.resolution.map((item) => pctBar(item)).join('')}
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
  const incidentRows = d.incidentMix.map((item) => pctBar(item, 'report-incident__bar')).join('');
  const notes = d.managementNotes.map((note) => `<li>${note}</li>`).join('');

  return `
    <section class="hud-block report-incident">${hudHead('Thống kê vụ việc xấu')}
      ${incidentRows}
    </section>
    <section class="hud-block report-advice">${hudHead('Góp ý cho ban quản lý')}
      <ul>${notes}</ul>
      <button type="button" class="report-advice__send">
        <i class="ti ti-send"></i><span>Gửi góp ý</span>
      </button>
    </section>
    <section class="hud-block report-focus">${hudHead('Điểm cần ưu tiên')}
      <div class="report-focus__row"><span>Khán đài B</span><strong>Quá tải 38%</strong></div>
      <div class="report-focus__row"><span>Kiosk C2</span><strong>Nguồn điện 17%</strong></div>
      <div class="report-focus__row"><span>Cổng A</span><strong>Y tế 24%</strong></div>
    </section>
  `;
}

export function bindReportsHistory(root) {
  if (!root || root.dataset.reportHistoryBound === 'true') return;
  root.dataset.reportHistoryBound = 'true';
  root.addEventListener('click', (e) => {
    const modal = root.querySelector('[data-report-history-modal]');
    if (!modal) return;

    if (e.target.closest('[data-report-history-open]')) {
      modal.hidden = false;
      return;
    }

    if (e.target.closest('[data-report-history-close]') || e.target === modal) {
      modal.hidden = true;
      return;
    }

    if (e.target.closest('[data-report-history-clear]')) {
      const list = modal.querySelector('[data-report-history-full]');
      const empty = modal.querySelector('[data-report-history-empty]');
      if (list) list.innerHTML = '';
      if (empty) empty.hidden = false;
    }
  });
}
