export function renderTeamList(items) {
  return items.map((i) =>
    `<div class="team-item"><span>${i.label}</span><span style="${i.statusStyle || ''}">${i.status}</span></div>`
  ).join('');
}

export function renderStationList(stations) {
  return stations.map((s) => `
    <div class="station-item" style="--accent:${s.accent}">
      <div class="station-top"><span>${s.name}</span><span style="color:${s.scoreColor};font-weight:600">${s.score}</span></div>
      <div class="station-metrics">${s.metrics.map((m) => `<span>${m}</span>`).join('')}</div>
    </div>`).join('');
}
