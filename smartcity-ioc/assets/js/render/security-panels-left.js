function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function camThumb(label) {
  return `<div class="hud-cam">
    <svg viewBox="0 0 80 50"><rect fill="#0a2848" width="80" height="50"/>
    <rect fill="#185FA5" x="10" y="15" width="25" height="20" opacity="0.4"/>
    <rect fill="#1D9E75" x="45" y="20" width="20" height="15" opacity="0.3"/></svg>
    <span>${label}</span>
  </div>`;
}

function barChartSvg(bars) {
  const max = Math.max(...bars.map((b) => b.value));
  const cols = bars.map((b, i) => {
    const h = (b.value / max) * 36;
    const fill = i % 2 ? '#4488ff' : '#00d4ff';
    return `<rect x="${4 + i * 18}" y="${40 - h}" width="12" height="${h}" fill="${fill}" rx="1"/>`;
  }).join('');
  const labels = bars.map((b, i) =>
    `<text x="${10 + i * 18}" y="48" fill="#5a8ab0" font-size="5" text-anchor="middle">${b.time.slice(-5)}</text>`,
  ).join('');
  return `<svg viewBox="0 0 112 52" class="hud-chart">${cols}${labels}</svg>`;
}

function donutSvg(segments) {
  let offset = 0;
  const r = 22;
  const cx = 28;
  const cy = 28;
  const circ = 2 * Math.PI * r;
  const arcs = segments.map((s) => {
    const len = (s.pct / 100) * circ;
    const dash = `${len} ${circ - len}`;
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}"
      stroke-width="7" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
    return el;
  }).join('');
  return `<svg viewBox="0 0 56 56" class="hud-donut">${arcs}
    <circle cx="${cx}" cy="${cy}" r="12" fill="#0a1828"/>
    <text x="${cx}" y="${cy + 3}" text-anchor="middle" fill="#00d4ff" font-size="10">👤</text>
  </svg>`;
}

export function renderLeftSidebar(d) {
  const groups = d.personnel.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value.toLocaleString('vi-VN')}</span></div>`,
  ).join('');
  const cams = d.cameras.feeds.map((f) => camThumb(f.label)).join('');
  const careLegend = d.residentsCare.segments.map((s) =>
    `<div class="hud-legend-row"><span class="hud-legend-dot" style="background:${s.color}"></span>${s.label}</div>`,
  ).join('');

  return `
    <section class="hud-block">${hudHead(d.personnel.title)}
      <div class="hud-metric-lbl">${d.personnel.totalLabel}</div>
      <div class="hud-metric-big">${d.personnel.total.toLocaleString('vi-VN')}</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}
      <div class="hud-cam-grid">${cams}</div>
    </section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.blacklist.title)}
      <div class="hud-inline-stat"><i class="ti ti-user-minus"></i><span>${d.blacklist.label}</span><strong>${d.blacklist.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.timeoutVisitors.title)}
      <div class="hud-sub">${d.timeoutVisitors.subtitle}</div>
      ${barChartSvg(d.timeoutVisitors.bars)}
    </section>
    <section class="hud-block">${hudHead(d.residentsCare.title)}
      <div class="hud-donut-wrap">${donutSvg(d.residentsCare.segments)}<div class="hud-legend">${careLegend}</div></div>
    </section>`;
}
