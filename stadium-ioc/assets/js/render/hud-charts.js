export function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

export function barChartSvg(bars) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const count = bars.length;
  const width = 112;
  const pad = 4;
  const slot = (width - pad * 2) / count;
  const barW = Math.min(12, Math.max(7, slot * 0.62));
  const cols = bars.map((b, i) => {
    const h = (b.value / max) * 36;
    const x = pad + i * slot + (slot - barW) / 2;
    const fill = i % 2 ? '#4488ff' : '#00d4ff';
    return `<rect x="${x.toFixed(1)}" y="${40 - h}" width="${barW.toFixed(1)}" height="${h}" fill="${fill}" rx="1"/>`;
  }).join('');
  const labels = bars.map((b, i) => {
    const x = pad + i * slot + slot / 2;
    return `<text x="${x.toFixed(1)}" y="48" fill="#5a8ab0" font-size="5" text-anchor="middle">${b.time}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} 52" class="hud-chart">${cols}${labels}</svg>`;
}

export function ringSvg(pct, label) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 56 56" class="hud-ring">
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="4"/>
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="#00d4ff" stroke-width="4"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 28 28)"/>
    <text x="28" y="25" text-anchor="middle" fill="#7ab0d0" font-size="5">${label}</text>
    <text x="28" y="34" text-anchor="middle" fill="#00d4ff" font-size="9" font-weight="600">${pct}%</text>
  </svg>`;
}

export function areaChartSvg(values, gradId = 'stadiumGrad') {
  const w = 120;
  const h = 36;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - v * h}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return `<svg viewBox="0 0 ${w} ${h + 4}" class="hud-area-chart">
    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#185FA5" stop-opacity="0.05"/>
    </linearGradient></defs>
    <polygon points="${area}" fill="url(#${gradId})"/>
    <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="1"/>
  </svg>`;
}

export function renderAlerts(alerts) {
  return alerts.map((a) =>
    `<div class="hud-alert">
      <span class="hud-alert__tag" style="background:${a.tagBg};color:${a.tagColor}">${a.tag}</span>
      <div class="hud-alert__title">${a.title}</div>
      <div class="hud-alert__time">${a.time}</div>
    </div>`,
  ).join('');
}

export function camThumb(label) {
  return `<div class="hud-cam">
    <svg viewBox="0 0 80 50"><rect fill="#1a2030" width="80" height="50"/>
    <ellipse cx="40" cy="28" rx="28" ry="14" fill="#0a3d2e" opacity="0.8"/>
    <text x="40" y="32" fill="#97C459" font-size="6" text-anchor="middle">PVF</text></svg>
    <span>${label}</span>
  </div>`;
}
