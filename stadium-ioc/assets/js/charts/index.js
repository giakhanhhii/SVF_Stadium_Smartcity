import { initEventsChart } from './events-chart.js';
import { initReportsChart } from './reports-chart.js';

export const chartRegistry = {
  events: initEventsChart,
  reports: initReportsChart,
};

export function initPageCharts(pageId) {
  const init = chartRegistry[pageId];
  if (init) init();
}
