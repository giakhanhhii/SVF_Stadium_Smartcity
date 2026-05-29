import { initTrafficChart } from './traffic-chart.js';
import { initEnvChart } from './env-chart.js';
import { initReportsChart } from './smartcity-reports-chart.js';

export const chartRegistry = {
  traffic: initTrafficChart,
  environment: initEnvChart,
  reports: initReportsChart,
};

export function initPageCharts(pageId) {
  const init = chartRegistry[pageId];
  if (init) init();
}
