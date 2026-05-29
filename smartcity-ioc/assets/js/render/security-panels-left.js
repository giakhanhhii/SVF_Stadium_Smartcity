function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function camThumb(label) {
  return `<div class="hud-cam" title="${label}">
    <svg viewBox="0 0 80 50"><rect fill="#0a2848" width="80" height="50"/>
    <rect fill="#185FA5" x="10" y="15" width="25" height="20" opacity="0.4"/>
    <rect fill="#1D9E75" x="45" y="20" width="20" height="15" opacity="0.3"/>
    <circle cx="61" cy="17" r="3" fill="#00d4ff"/></svg>
    <span></span>
  </div>`;
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
    <path d="M23 25a5 5 0 1 1 10 0a5 5 0 0 1-10 0Zm-5 17c1-6 5-10 10-10s9 4 10 10" fill="none" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function verticalBars(bars) {
  const max = Math.max(...bars.map((b) => b.value));
  return `<div class="hud-vbar-chart">${bars.map((b) => {
    const h = (b.value / max) * 38;
    return `<div class="hud-vbar" title="${b.time}: ${b.value}">
      <i style="height:${h}px"></i>
      <span>${b.value}</span>
    </div>`;
  }).join('')}</div>`;
}

function distributionChart(groups) {
  const total = groups.reduce((sum, g) => sum + g.value, 0);
  const segments = groups.map((g) => {
    const pct = Math.round((g.value / total) * 100);
    return `<span class="hud-stack-seg hud-stack-seg--${g.tone}" style="width:${pct}%" title="${g.label}: ${pct}%"></span>`;
  }).join('');
  const legend = groups.map((g) =>
    `<div class="hud-mini-kpi hud-mini-kpi--${g.tone}">
      <span>${g.label}</span>
      <strong>${g.value.toLocaleString('vi-VN')}</strong>
    </div>`,
  ).join('');
  return `<div class="hud-total-chart">
    <div class="hud-total">${total.toLocaleString('vi-VN')}</div>
    <div class="hud-stack">${segments}</div>
    <div class="hud-mini-kpi-grid">${legend}</div>
  </div>`;
}

export function renderLeftSidebar(d) {
  const cams = d.cameras.feeds.map((f) => camThumb(f.label)).join('');
  const careLegend = d.residentsCare.segments.map((s) =>
    `<div class="hud-legend-row"><span class="hud-legend-dot" style="background:${s.color}"></span>${s.label}</div>`,
  ).join('');

  return `
    <section class="hud-block">${hudHead(d.personnel.title)}
      ${distributionChart(d.personnel.groups)}
    </section>
    <section class="hud-block">${hudHead(d.cameras.title)}
      <div class="hud-cam-grid">${cams}</div>
    </section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.blacklist.title)}
      <div class="hud-risk-gauge">
        <i class="ti ti-user-minus"></i>
        <strong>${d.blacklist.value}</strong>
        <span>${d.blacklist.label}</span>
      </div>
    </section>
    <section class="hud-block">${hudHead(d.timeoutVisitors.title)}
      ${verticalBars(d.timeoutVisitors.bars)}
    </section>
    <section class="hud-block">${hudHead(d.residentsCare.title)}
      <div class="hud-donut-wrap">${donutSvg(d.residentsCare.segments)}<div class="hud-legend">${careLegend}</div></div>
    </section>`;
}
