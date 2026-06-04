/** Font Chart.js — khớp typography.css */
export const CHART_FONT_FAMILY = '"Be Vietnam Pro", "Noto Sans", "Segoe UI Variable Text", "Segoe UI", Arial, sans-serif';

if (globalThis.Chart?.defaults?.font) {
  globalThis.Chart.defaults.font.family = CHART_FONT_FAMILY;
}

export function chartTickFont(size = 10) {
  return { family: CHART_FONT_FAMILY, size };
}
