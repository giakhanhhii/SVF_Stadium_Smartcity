function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function compactLineChart(values, labels, id) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = 8 + index * (104 / (values.length - 1));
    const y = 58 - ((value - min) / range) * 42;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,62 ${points.join(' ')} 112,62`;
  return `<svg class="smart-overview-line" viewBox="0 0 120 72" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#185fa5" stop-opacity="0.05"/>
    </linearGradient></defs>
    <g class="smart-overview-line__grid">
      ${[16, 30, 44, 58].map((y) => `<line x1="8" y1="${y}" x2="112" y2="${y}"/>`).join('')}
      ${labels.map((label, index) => `<text x="${8 + index * (104 / (labels.length - 1))}" y="70" text-anchor="middle">${label}</text>`).join('')}
    </g>
    <polygon points="${area}" fill="url(#${id})"/>
    <polyline class="smart-overview-line__stroke" points="${points.join(' ')}"/>
    ${points.map((point, index) => {
    const [x, y] = point.split(',');
    return `<circle cx="${x}" cy="${y}" r="2.5"/><text class="smart-overview-line__value" x="${x}" y="${Number(y) - 6}">${values[index]}</text>`;
  }).join('')}
  </svg>`;
}

function overviewBarChart(values, labels) {
  const max = Math.max(...values, 1);
  const chartTop = 14;
  const chartBottom = 62;
  const chartHeight = chartBottom - chartTop;
  const step = 104 / values.length;
  const barWidth = Math.min(14, step * 0.46);
  return `<svg class="smart-overview-bar-chart" viewBox="0 0 120 76" aria-hidden="true">
    <g class="smart-overview-bar-chart__grid">
      ${[22, 38, 54].map((y) => `<line x1="8" y1="${y}" x2="112" y2="${y}"/>`).join('')}
    </g>
    ${values.map((value, index) => {
    const x = 8 + index * step + (step - barWidth) / 2;
    const height = Math.max(8, (value / max) * chartHeight);
    const y = chartBottom - height;
    const cx = x + barWidth / 2;
    return `<g class="smart-overview-bar-chart__item smart-overview-bar-chart__item--${index + 1}">
      <text class="smart-overview-bar-chart__value" x="${cx.toFixed(1)}" y="${Math.max(10, y - 5).toFixed(1)}">${value}</text>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" rx="3"/>
      <text class="smart-overview-bar-chart__label" x="${cx.toFixed(1)}" y="73">${labels[index]}</text>
    </g>`;
  }).join('')}
  </svg>`;
}

function utilityUsageChart(data) {
  return `<div class="smart-overview-utility-usage">
    <div class="smart-overview-utility-usage__meta">
      <span>Lượt sử dụng 6 tháng</span>
      <strong>T5 cao nhất · ${Math.max(...data.values)}%</strong>
    </div>
    <div class="smart-overview-usage-bars">
      ${data.values.map((value, index) => `<span class="smart-overview-usage-bar">
        <em>${data.labels[index]}</em>
        <i><b style="height:${value}%"></b></i>
        <strong>${value}%</strong>
      </span>`).join('')}
    </div>
  </div>`;
}

function piePoint(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return `${(cx + Math.cos(rad) * r).toFixed(1)} ${(cy + Math.sin(rad) * r).toFixed(1)}`;
}

function piePath(cx, cy, r, start, end) {
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${piePoint(cx, cy, r, start)} A ${r} ${r} 0 ${large} 1 ${piePoint(cx, cy, r, end)} Z`;
}

function cityPie3d(groups) {
  const total = groups.reduce((sum, group) => sum + group.value, 0) || 1;
  let angle = -22;
  const slices = groups.map((group) => {
    const span = group.value / total * 360;
    const path = piePath(58, 58, 46, angle, angle + span - 3);
    const mid = angle + span / 2;
    const dot = piePoint(58, 58, 34, mid).split(' ');
    const pin = piePoint(58, 58, 58, mid).split(' ');
    angle += span;
    return { ...group, path, dot, pin };
  });
  return `<div class="traffic-viz-pie resident-viz-pie smart-overview-city-pie">
    <svg viewBox="0 0 122 122" aria-hidden="true">
      <ellipse class="traffic-viz-pie__shadow" cx="58" cy="66" rx="45" ry="35"/>
      ${slices.map((s) => `<path class="traffic-viz-pie__slice" d="${s.path}" fill="${s.color}"/>`).join('')}
      ${slices.map((s) => `<line class="traffic-viz-pie__pin" x1="${s.dot[0]}" y1="${s.dot[1]}" x2="${s.pin[0]}" y2="${s.pin[1]}"/>
        <circle class="traffic-viz-pie__dot" cx="${s.pin[0]}" cy="${s.pin[1]}" r="2.2"/>
        <circle class="traffic-viz-pie__dot traffic-viz-pie__dot--inner" cx="${s.dot[0]}" cy="${s.dot[1]}" r="1.8"/>`).join('')}
      <circle class="traffic-viz-pie__core" cx="58" cy="58" r="18"/>
      <circle class="traffic-viz-pie__core-light" cx="58" cy="58" r="9"/>
    </svg>
  </div>`;
}

function cityStack(groups) {
  const total = groups.reduce((sum, group) => sum + group.value, 0) || 1;
  return `<div class="smart-overview-city-stack">
    ${groups.map((group) => `<i style="width:${Math.max(8, Math.round(group.value / total * 100))}%;background:${group.color}"></i>`).join('')}
  </div>`;
}

function cityFlowChart(flow) {
  const points = flow.values.map((value, index) => {
    const max = Math.max(...flow.values, 1);
    const min = Math.min(...flow.values, 0);
    const range = Math.max(max - min, 1);
    const x = 8 + index * (104 / (flow.values.length - 1));
    const y = 58 - ((value - min) / range) * 42;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `8,62 ${points.join(' ')} 112,62`;
  return `<svg class="smart-overview-city-flow" viewBox="0 0 120 72" aria-hidden="true">
    <polygon points="${area}"/>
    <polyline points="${points.join(' ')}"/>
    ${points.map((point) => {
    const [x, y] = point.split(',');
    return `<circle cx="${x}" cy="${y}" r="2.2"/>`;
  }).join('')}
    ${flow.labels.map((label, index) => `<text x="${8 + index * (104 / (flow.labels.length - 1))}" y="70" text-anchor="middle">${label}</text>`).join('')}
  </svg>`;
}

function cityOverviewChart(city) {
  return `<div class="smart-overview-city-total">
    <div class="smart-overview-city-total__top">
      ${cityPie3d(city.groups)}
      <div class="smart-overview-city-total__main">
        <strong>${city.activeResidents}</strong>
        <span>${city.capacityLabel || `Cư dân / ${city.capacity}`}</span>
      </div>
    </div>
    ${cityStack(city.groups)}
    <div class="smart-overview-city-badges">
      ${city.badges.map((badge) => `<span><b>${badge.value}</b><em>${badge.label}</em></span>`).join('')}
    </div>
    <div class="smart-overview-city-ingress">
      ${cityFlowChart(city.flow)}
      <div class="smart-overview-city-ingress__main">
        <i class="ti ti-door-enter"></i>
        <span><b>${city.flowNow}</b><em>${city.flowLabel || 'ra/vào khu'}</em></span>
      </div>
    </div>
  </div>`;
}

function radarChart(values, labels) {
  const cx = 74;
  const cy = 66;
  const maxR = 46;
  const sides = labels.length;
  const point = (index, radius) => {
    const angle = (-90 + index * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  };
  const ring = (radius) => labels.map((_, index) => point(index, radius)).join(' ');
  const data = values.map((value, index) => point(index, maxR * value)).join(' ');
  const axes = labels.map((label, index) => {
    const angle = (-90 + index * (360 / sides)) * Math.PI / 180;
    const tx = cx + Math.cos(angle) * 58;
    const ty = cy + Math.sin(angle) * 58;
    const [x2, y2] = point(index, maxR).split(',');
    const anchor = tx < cx - 8 ? 'end' : tx > cx + 8 ? 'start' : 'middle';
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${label}</text>`;
  }).join('');
  return `<svg class="smart-overview-radar" viewBox="0 0 148 132" aria-hidden="true">
    <defs><linearGradient id="smartOverviewRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#185fa5" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="smart-overview-radar__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(31)}"/><polygon points="${ring(maxR)}"/>
      ${axes}
    </g>
    <polygon class="smart-overview-radar__shadow" points="${data}"/>
    <polygon class="smart-overview-radar__shape" points="${data}"/>
    ${values.map((value, index) => {
    const [x, y] = point(index, maxR * value).split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/>`;
  }).join('')}
  </svg>`;
}

function miniBars(items) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="smart-overview-bars">
    ${items.map((item) => `<span>
      <b>${item.label}</b>
      <i><em style="width:${Math.max(10, Math.round(item.value / max * 100))}%"></em></i>
      <strong>${item.meta}</strong>
    </span>`).join('')}
  </div>`;
}

function routeDiagram(items) {
  return `<div class="smart-overview-route">
    ${items.map((item, index) => `${index ? '<i></i>' : ''}
      <button type="button" class="smart-overview-route__node smart-overview-route__node--${item.tone}" data-nav="${item.nav}">
        <b>${item.label}</b><em>${item.value}</em>
      </button>`).join('')}
  </div>`;
}

function nodeMap(nodes) {
  const center = { x: 50, y: 50 };
  return `<div class="smart-overview-node-map">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="smart-overview-node-map__ring" cx="50" cy="50" r="30"/>
      <circle class="smart-overview-node-map__axis" cx="50" cy="50" r="18"/>
      ${nodes.map((node) => `<line class="smart-overview-node-map__line smart-overview-node-map__line--${node.tone}" x1="${center.x}" y1="${center.y}" x2="${node.x}" y2="${node.y}"/>`).join('')}
      <circle class="smart-overview-node-map__core" cx="50" cy="50" r="9"/>
      ${nodes.map((node) => `<g class="smart-overview-node-map__node smart-overview-node-map__node--${node.tone}" transform="translate(${node.x} ${node.y})">
        <circle r="7"/><text y="2.7">${node.label}</text>
      </g>`).join('')}
    </svg>
    <div class="smart-overview-node-map__metrics">
      ${nodes.map((node) => `<button type="button" class="smart-overview-node-map__metric" data-nav="${node.nav}">
        <b>${node.value}</b><em>${node.name}</em>
      </button>`).join('')}
    </div>
  </div>`;
}

function kpiStrip(items) {
  return `<div class="smart-overview-kpis">
    ${items.map((item) => `<span><b>${item.value}</b><em>${item.label}</em></span>`).join('')}
  </div>`;
}

function domainCard(card) {
  const action = card.actions
    || (card.action === false
    ? ''
    : `<button type="button" class="smart-overview-domain__open" ${card.action === 'redlight' ? 'data-redlight-open' : `data-nav="${card.nav}"`}>
       <i class="ti ${card.actionIcon || card.icon}"></i><span>${card.actionLabel || `Mở ${card.shortTitle}`}</span>
    </button>`);

  return `<section class="hud-block smart-overview-domain smart-overview-domain--${card.id}">
    ${hudHead(card.title)}
    <div class="smart-overview-domain__body">${card.chart}</div>
    ${card.kpis ? kpiStrip(card.kpis) : ''}
    ${action}
  </section>`;
}

export function renderSmartcityOverviewLeft(d) {
  const cards = [
    {
      id: 'city',
      nav: 'overview',
      icon: 'ti-layout-dashboard',
      title: 'Tổng quan vận hành',
      shortTitle: 'tổng quan',
      chart: cityOverviewChart(d.city),
      actions: `<div class="smart-overview-map-toggle" data-worldmap-host>
        <label class="map-switch">
          <input type="checkbox" class="map-switch__input" data-worldmap-toggle aria-label="Bật bản đồ thế giới">
          <span class="map-switch__track"><span class="map-switch__thumb"></span></span>
          <span class="map-switch__text">Bật bản đồ</span>
        </label>
        <button type="button" class="map-switch__goto" data-worldmap-goto hidden>
          <i class="ti ti-map-pin"></i><span>Đến TechnoPark</span>
        </button>
      </div>`,
    },
    {
      id: 'traffic',
      nav: 'traffic',
      icon: 'ti-traffic-lights',
      title: 'Giao thông',
      shortTitle: 'giao thông',
      chart: routeDiagram(d.traffic.routes),
      kpis: d.traffic.kpis,
      action: 'redlight',
      actionIcon: 'ti-traffic-lights-off',
      actionLabel: 'Xử lý vượt đèn đỏ',
    },
    {
      id: 'security',
      nav: 'security',
      icon: 'ti-shield-check',
      title: 'An ninh',
      shortTitle: 'an ninh',
      chart: `<div class="smart-overview-stack">${radarChart(d.security.radar.values, d.security.radar.labels)}${miniBars(d.security.metrics)}</div>`,
      kpis: d.security.kpis,
      actions: `<div class="smart-overview-route-actions">
        <button type="button" class="event-risk__btn" data-smartcity-route-action="open">
          <i class="ti ti-door-exit"></i><span>Mở B2/C1</span>
        </button>
        <button type="button" class="event-risk__btn" data-smartcity-route-action="reverse">
          <i class="ti ti-arrow-guide"></i><span>Đảo luồng</span>
        </button>
        <button type="button" class="event-risk__btn" data-smartcity-route-action="pa">
          <i class="ti ti-speakerphone"></i><span>PA hướng dẫn</span>
        </button>
      </div>`,
    },
  ];
  return cards.map(domainCard).join('');
}

export function renderSmartcityOverviewRight(d) {
  const cards = [
    {
      id: 'environment',
      nav: 'environment',
      icon: 'ti-building-estate',
      title: 'Hạ tầng',
      shortTitle: 'hạ tầng',
      chart: `<div class="smart-overview-stack">${compactLineChart(d.environment.trend.values, d.environment.trend.labels, 'smartOverviewInfraLine')}${miniBars(d.environment.metrics)}</div>`,
      kpis: d.environment.kpis,
      actions: `<div class="event-fire-auto smart-overview-pccc-action">
        <button type="button" class="event-fire-auto__button" data-pccc-open="auto" aria-label="Kích hoạt Auto PCCC">
          <i class="ti ti-shield-bolt"></i>
          <span>Auto PCCC</span>
        </button>
        <p data-pccc-card-status>2 tòa nhà có nguy cơ cháy nổ</p>
      </div>`,
    },
    {
      id: 'utilities',
      nav: 'utilities',
      icon: 'ti-bolt',
      title: 'Dịch vụ Vin',
      shortTitle: 'dịch vụ',
      chart: `<div class="smart-overview-stack smart-overview-stack--utility">${utilityUsageChart(d.utilities.trend)}${miniBars(d.utilities.metrics)}</div>`,
      kpis: d.utilities.kpis,
    },
    {
      id: 'reports',
      nav: 'reports',
      icon: 'ti-chart-bar',
      title: 'Báo cáo',
      shortTitle: 'báo cáo',
      chart: nodeMap(d.reports.nodes),
      kpis: d.reports.kpis,
    },
  ];
  return cards.map(domainCard).join('');
}
