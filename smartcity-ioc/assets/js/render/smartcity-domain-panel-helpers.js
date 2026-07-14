// Helper HTML/SVG dùng chung cho các panel domain smartcity.
// (hudHead sẽ hợp nhất về shared-ioc theo lộ trình Phase 6.)
export function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

export function infraPiePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

export function infraPiePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${infraPiePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${infraPiePoint(cx, cy, r, end)} Z`;
}
