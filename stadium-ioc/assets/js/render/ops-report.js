import { hudHead, ringSvg, barChartSvg } from './hud-charts.js';
import { distributionChart } from './radial3d-chart.js';
import {
  renderDispatchDialog, MEDICAL_DISPATCH, SECURITY_DISPATCH, openDispatchDialog,
} from './emergency-dispatch.js';

function pendingRow(c, catId) {
  return `<button type="button" class="ops-report__pending" data-ops-case="${c.id}" data-ops-cat="${catId}" title="${c.title}" aria-label="${c.id} ${c.title}">
    <span class="ops-report__pending-id">${c.id}</span>
    <span class="ops-report__pending-badge">${c.wait}</span>
  </button>`;
}

function reportCard(cat) {
  const pct = cat.sent ? Math.round((cat.processed / cat.sent) * 100) : 0;
  const pendingCount = cat.pending?.length || 0;
  const pending = cat.pending?.length
    ? `<div class="ops-report__pending-list">${cat.pending.map((c) => pendingRow(c, cat.id)).join('')}</div>`
    : '';
  const pendingLbl = cat.pending?.length
    ? `<span class="ops-report__pending-count">${pendingCount}</span>`
    : '<span class="ops-report__pending-count ops-report__pending-count--clear">0</span>';
  return `<section class="hud-block ops-report" data-ops-cat-card="${cat.id}">
    <div class="ops-report__head">
      <span class="ops-report__icon"><i class="ti ${cat.icon}" aria-hidden="true"></i></span>
      <span class="ops-report__title">${cat.title}</span>
      ${pendingLbl}
    </div>
    <div class="ops-report__viz">
      ${ringSvg(pct, 'SLA')}
      <div class="ops-report__spark">
        <div class="ops-report__mini-grid">
          <span><b>${cat.sent}</b><em>gửi</em></span>
          <span><b>${cat.processed}</b><em>đóng</em></span>
          <span><b>${pendingCount}</b><em>chờ</em></span>
        </div>
        <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    ${pending}
  </section>`;
}

export function renderOpsReportDashboard(data) {
  const cards = data.categories.map(reportCard).join('');
  const totalSent = data.categories.reduce((sum, cat) => sum + cat.sent, 0);
  const totalProcessed = data.categories.reduce((sum, cat) => sum + cat.processed, 0);
  const totalPending = data.categories.reduce((sum, cat) => sum + (cat.pending?.length || 0), 0);
  const closePct = totalSent ? Math.round((totalProcessed / totalSent) * 100) : 0;
  const labelByCat = { medical: 'YT', fire: 'PCCC', crowd: 'AT' };
  const queueBars = [
    ...data.categories.map((cat) => ({
      time: labelByCat[cat.id] || cat.title.slice(0, 4),
      value: cat.pending?.length || 0,
    })),
    { time: 'F&B', value: 4 },
    { time: 'IT', value: 2 },
    { time: 'VIP', value: 1 },
  ];
  return `
    <section class="hud-block ops-overview-venue">${hudHead(data.venue.title)}
      ${distributionChart(data.venue.total, data.venue.groups, { idSuffix: 'Venue' })}
    </section>
    <section class="hud-block ops-report-summary">${hudHead('VOC Ops')}
      <div class="ops-report-summary__viz">
        ${ringSvg(closePct, 'Close')}
        <div class="ops-report-summary__nums">
          <span><b>${totalSent}</b><em>gửi</em></span>
          <span><b>${totalProcessed}</b><em>đóng</em></span>
          <span class="ops-report-summary__warn"><b>${totalPending}</b><em>chờ</em></span>
        </div>
      </div>
      ${barChartSvg(queueBars)}
    </section>
    ${cards}
    <div class="ops-case-detail" data-ops-detail hidden>
      <div class="ops-case-detail__panel">
        <button type="button" class="ops-case-detail__back" data-ops-detail-close aria-label="Quay lại">
          <i class="ti ti-arrow-left"></i><span>Danh sách</span>
        </button>
        <div class="ops-case-detail__tag" data-ops-detail-tag>Chưa xử lý</div>
        <h4 class="ops-case-detail__title" data-ops-detail-title></h4>
        <dl class="ops-case-detail__meta">
          <div><dt>Mã yêu cầu</dt><dd data-ops-detail-id></dd></div>
          <div><dt>Vị trí</dt><dd data-ops-detail-zone></dd></div>
          <div><dt>Gửi lúc</dt><dd data-ops-detail-sent></dd></div>
          <div><dt>Chờ</dt><dd data-ops-detail-wait></dd></div>
          <div><dt>Người phụ trách</dt><dd data-ops-detail-handler></dd></div>
        </dl>
        <div class="ops-case-detail__reason">
          <span>Lý do chưa xử lý</span>
          <p data-ops-detail-reason></p>
        </div>
        <div class="ops-case-detail__actions">
          <button type="button" class="ops-case-detail__primary" data-ops-rereport>
            <i class="ti ti-phone-call"></i><span>Báo lại / Báo cáo</span>
          </button>
          <button type="button" class="ops-case-detail__secondary" data-ops-escalate-open>
            <i class="ti ti-flag"></i><span>Báo cáo người phụ trách</span>
          </button>
        </div>
      </div>
    </div>
    <div class="ops-escalate" data-ops-escalate hidden>
      <div class="ops-escalate__panel" role="dialog" aria-modal="true" aria-label="Báo cáo người phụ trách">
        <button type="button" class="ops-escalate__close" data-ops-escalate-close aria-label="Đóng"><i class="ti ti-x"></i></button>
        <h4>Báo cáo người phụ trách</h4>
        <p class="ops-escalate__sub" data-ops-escalate-target></p>
        <label class="ops-escalate__field">
          <span>Nội dung khiển trách / chuyển ban phụ trách</span>
          <textarea data-ops-escalate-note rows="3" placeholder="Mô tả vi phạm xử lý, thời gian chậm trễ..."></textarea>
        </label>
        <button type="button" class="ops-escalate__send" data-ops-escalate-send>
          <i class="ti ti-send"></i><span>Gửi ban phụ trách VOC</span>
        </button>
        <p class="ops-escalate__status" data-ops-escalate-status hidden></p>
      </div>
    </div>
    ${renderDispatchDialog(MEDICAL_DISPATCH)}
    ${renderDispatchDialog(SECURITY_DISPATCH)}`;
}

const caseIndex = new Map();

export function indexOpsCases(categories) {
  caseIndex.clear();
  categories.forEach((cat) => {
    cat.pending?.forEach((c) => {
      caseIndex.set(c.id, { ...c, cat });
    });
  });
}

const boundRoots = new WeakSet();

export function bindOpsReports(root) {
  if (!root || boundRoots.has(root)) return;
  boundRoots.add(root);

  const detail = root.querySelector('[data-ops-detail]');
  const escalate = root.querySelector('[data-ops-escalate]');
  let activeCase = null;

  const fillDetail = (rec) => {
    activeCase = rec;
    detail.querySelector('[data-ops-detail-id]').textContent = rec.id;
    detail.querySelector('[data-ops-detail-title]').textContent = rec.title;
    detail.querySelector('[data-ops-detail-zone]').textContent = rec.zone;
    detail.querySelector('[data-ops-detail-sent]').textContent = rec.sentAt;
    detail.querySelector('[data-ops-detail-wait]').textContent = rec.wait;
    detail.querySelector('[data-ops-detail-handler]').textContent = rec.handler;
    detail.querySelector('[data-ops-detail-reason]').textContent = rec.reason;
    detail.hidden = false;
  };

  const closeDetail = () => {
    detail.hidden = true;
    activeCase = null;
  };

  root.addEventListener('click', (e) => {
    const caseBtn = e.target.closest('[data-ops-case]');
    if (caseBtn) {
      const rec = caseIndex.get(caseBtn.dataset.opsCase);
      if (rec) fillDetail(rec);
      return;
    }
    if (e.target.closest('[data-ops-detail-close]')) {
      closeDetail();
      return;
    }
    if (e.target.closest('[data-ops-rereport]') && activeCase) {
      const rec = activeCase;
      detail.hidden = true;
      openDispatchDialog(rec.cat.dispatchId, {
        type: rec.cat.dispatchType,
        note: `[${rec.id}] Báo lại: ${rec.title}\n${rec.zone}\nLý do chưa xử lý: ${rec.reason}`,
        titleSuffix: rec.id,
      });
      return;
    }
    if (e.target.closest('[data-ops-escalate-open]') && activeCase) {
      escalate.hidden = false;
      escalate.querySelector('[data-ops-escalate-target]').textContent =
        `${activeCase.handler} · Yêu cầu ${activeCase.id}`;
      escalate.querySelector('[data-ops-escalate-note]').value = '';
      escalate.querySelector('[data-ops-escalate-status]').hidden = true;
      return;
    }
    if (e.target.closest('[data-ops-escalate-close]')) {
      escalate.hidden = true;
      return;
    }
    if (e.target.closest('[data-ops-escalate-send]')) {
      const status = escalate.querySelector('[data-ops-escalate-status]');
      status.hidden = false;
      status.textContent = 'Đã chuyển ban phụ trách VOC — chờ xác nhận khiển trách.';
      setTimeout(() => { escalate.hidden = true; }, 1600);
      return;
    }
    if (e.target === detail) {
      closeDetail();
      return;
    }
  });
}
