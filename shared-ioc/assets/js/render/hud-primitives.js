// Primitive HTML/SVG dùng chung cho HUD của cả smartcity-ioc và stadium-ioc.
// Chỉ chứa các hàm GIỐNG HỆT giữa các bản copy cũ; ringSvg các nơi cố ý khác
// kích thước/màu nên vẫn để riêng từng file.

export function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

export function piePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

export function piePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${piePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${piePoint(cx, cy, r, end)} Z`;
}
