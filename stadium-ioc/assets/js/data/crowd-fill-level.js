/** Ngưỡng mật độ: xanh <70%, vàng 70–89%, đỏ ≥90% */
export function getCrowdFillLevel(percent) {
  const pct = Math.round(percent);
  if (pct >= 90) {
    return { pct, tone: 'danger', label: 'Quá tải — nguy cơ dẫm đạp', color: '#E24B4A' };
  }
  if (pct >= 70) {
    return { pct, tone: 'warn', label: 'Đông — theo dõi sát', color: '#BA7517' };
  }
  return { pct, tone: 'ok', label: 'Ổn định', color: '#1D9E75' };
}
