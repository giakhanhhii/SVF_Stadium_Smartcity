function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function sectorPath(cx, cy, innerR, outerR, startDeg, endDeg) {
  const gap = 2;
  const start = startDeg + gap;
  const end = endDeg - gap;
  const outerStart = polar(cx, cy, outerR, start);
  const outerEnd = polar(cx, cy, outerR, end);
  const innerEnd = polar(cx, cy, innerR, end);
  const innerStart = polar(cx, cy, innerR, start);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function radial3dChart(groups, { idSuffix = '' } = {}) {
  const total = groups.reduce((sum, g) => sum + g.value, 0) || 1;
  let angle = -22;
  const palette = ['#00d4ff', '#27b8ff', '#5aa7ff', '#7cdcff', '#1a8fca'];
  const slices = groups.map((g, i) => {
    const sweep = Math.max(34, (g.value / total) * 300);
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const mid = (start + end) / 2;
    const pin = polar(56, 56, 42, mid);
    const dot = polar(56, 56, 58, mid);
    const color = palette[i % palette.length];
    return `
      <path class="stad-sec-radial3d__depth" d="${sectorPath(56, 61, 14, 45, start, end)}"/>
      <path class="stad-sec-radial3d__slice" d="${sectorPath(56, 56, 14, 45, start, end)}" fill="${color}" opacity="${0.92 - i * 0.08}"/>
      <circle cx="${pin.x.toFixed(2)}" cy="${pin.y.toFixed(2)}" r="2" fill="#b9f5ff" opacity="0.8"/>
      <line x1="${pin.x.toFixed(2)}" y1="${pin.y.toFixed(2)}" x2="${dot.x.toFixed(2)}" y2="${dot.y.toFixed(2)}" stroke="#4aaed1" stroke-width="0.8" opacity="0.5"/>
      <circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="2.2" fill="#7ff3ff" opacity="0.82"/>`;
  }).join('');

  const coreId = `stadSecRadialCore${idSuffix}`;
  const shadowId = `stadSecRadialShadow${idSuffix}`;

  return `<svg class="stad-sec-radial3d" viewBox="0 0 112 112" aria-hidden="true">
    <defs>
      <radialGradient id="${coreId}" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="#0de6ff"/>
        <stop offset="72%" stop-color="#123bdb"/>
        <stop offset="100%" stop-color="#061852"/>
      </radialGradient>
      <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#00192c" flood-opacity="0.65"/>
      </filter>
    </defs>
    <circle cx="56" cy="56" r="42" fill="rgba(0,212,255,0.05)" filter="url(#${shadowId})"/>
    ${slices}
    <circle cx="56" cy="56" r="14" fill="#061446" stroke="#3c5cff" stroke-width="3"/>
    <circle cx="56" cy="56" r="7" fill="url(#${coreId})"/>
  </svg>`;
}

export function distributionChart(total, groups, { idSuffix = 'Dist' } = {}) {
  const groupTotal = groups.reduce((sum, g) => sum + g.value, 0) || total;
  const stack = distributionStack(groups, groupTotal);
  const values = distributionMinis(groups);
  return `<div class="stad-sec-total">
    <div class="stad-sec-total__top">
      ${radial3dChart(groups, { idSuffix })}
      <strong>${total.toLocaleString('vi-VN')}</strong>
    </div>
    ${stack}
    ${values}
  </div>`;
}

export function distributionStack(groups, groupTotal = groups.reduce((sum, g) => sum + g.value, 0) || 1) {
  const stack = groups.map((g) => {
    const segPct = Math.max(8, Math.round((g.value / groupTotal) * 100));
    return `<span class="stad-sec-stack__seg" style="width:${segPct}%" title="${g.label}: ${g.value.toLocaleString('vi-VN')}"></span>`;
  }).join('');
  return `<div class="stad-sec-stack">${stack}</div>`;
}

export function distributionMinis(groups) {
  const values = groups.map((g) =>
    `<div class="stad-sec-mini"><span>${g.label}</span><strong>${g.value.toLocaleString('vi-VN')}</strong></div>`,
  ).join('');
  return `<div class="stad-sec-mini-grid">${values}</div>`;
}
