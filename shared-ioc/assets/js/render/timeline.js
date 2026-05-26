export function renderEventTimeline(events) {
  return events.map((e) => `
    <div class="event-item"${e.highlight ? ` style="border-color:${e.highlight}"` : ''}>
      <div class="event-time">${e.time}</div>
      <div>
        <div class="event-item-title">${e.title}</div>
        <div class="event-item-desc">${e.desc}</div>
      </div>
    </div>`).join('');
}
