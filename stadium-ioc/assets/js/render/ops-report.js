import { hudHead, ringSvg, barChartSvg } from './hud-charts.js';
import {
  renderDispatchDialog, MEDICAL_DISPATCH, SECURITY_DISPATCH, openDispatchDialog,
} from './emergency-dispatch.js';

function miniPie3d(pct) {
  const used = Math.max(0, Math.min(100, pct));
  const free = 100 - used;
  const items = [
    { label: 'A', value: used },
    { label: 'B', value: Math.max(Math.round(free * 0.45), 1) },
    { label: 'C', value: Math.max(Math.round(free * 0.35), 1) },
    { label: 'D', value: Math.max(Math.round(free * 0.2), 1) },
  ];
  const colors = ['#00d4ff', '#3c8cff', '#7bdcff', '#176f9d'];
  const polar = (r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 56 + Math.cos(rad) * r, y: 56 + Math.sin(rad) * r };
  };
  const sector = (start, end, innerR, outerR) => {
    const a = polar(outerR, start);
    const b = polar(outerR, end);
    const c = polar(innerR, end);
    const d = polar(innerR, start);
    const large = end - start > 180 ? 1 : 0;
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${outerR} ${outerR} 0 ${large} 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} L ${c.x.toFixed(1)} ${c.y.toFixed(1)} A ${innerR} ${innerR} 0 ${large} 0 ${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;
  };
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let angle = -18;
  const slices = items.map((item, i) => {
    const sweep = Math.max(26, (item.value / total) * 318);
    const start = angle + 3;
    const end = angle + sweep - 3;
    angle = end;
    const pin = polar(41, start + sweep / 2);
    return `<path class="overview-radial-gauge__slice" d="${sector(start, end, 16, 43)}" fill="${colors[i]}" opacity="${0.96 - i * 0.12}"/>
      <circle cx="${pin.x.toFixed(1)}" cy="${pin.y.toFixed(1)}" r="2" fill="#bdf7ff" opacity="0.75"/>`;
  }).join('');
  const legend = items.map((item, i) =>
    `<span style="--legend-pct:${Math.round((item.value / total) * 100)}%;--legend-color:${colors[i]}">
      <i></i><b>${item.label}</b><small></small><em>${Math.round((item.value / total) * 100)}%</em>
    </span>`,
  ).join('');
  return `<div class="overview-pie3d-card overview-radial-card">
    <div class="overview-radial-card__top">
      <svg class="overview-radial-gauge" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r="44" fill="rgba(0,212,255,0.08)"/>
        ${slices}
        <circle cx="56" cy="56" r="15" fill="#092064" stroke="#00d4ff" stroke-width="3"/>
        <circle cx="56" cy="56" r="7" fill="#173cff"/>
      </svg>
      <strong>${pct}%</strong>
    </div>
    <div class="overview-radial-card__track">${items.map((item, i) =>
    `<span style="width:${Math.round((item.value / total) * 100)}%;background:${colors[i]}"></span>`,
  ).join('')}</div>
    <div class="overview-pie3d-card__legend">${legend}</div>
  </div>`;
}

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
  const queueBars = data.categories.map((cat) => ({
    time: labelByCat[cat.id] || cat.title.slice(0, 4),
    value: cat.pending?.length || 0,
  }));
  return `
    <section class="hud-block ops-overview-venue">${hudHead(data.venue.title)}
      <div class="ops-overview-venue__viz">
        ${miniPie3d(data.venue.pct)}
        <div>
          <strong>${data.venue.capacity}</strong>
          <span>${data.venue.capacityLabel}</span>
        </div>
      </div>
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
