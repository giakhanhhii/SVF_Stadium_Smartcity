import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { bindHudTabs } from '../../../shared-ioc/assets/js/render/hud-tabs.js';
import { hydrateAllPages } from './pages/smartcity-page-hydration.js';
import { initPageCharts } from './charts/smartcity-chart-registry.js';
import { initPageScenes } from './scene/smartcity-scene-registry.js';

function onNavigate(pageId) {
  initPageCharts(pageId);
  initPageScenes(pageId);
}

createApp({
  pageIds: ['overview', 'traffic', 'security', 'environment', 'utilities', 'reports'],
  shellPath: 'partials/shell/smartcity-header.html',
  pagePaths: {
    overview: 'partials/pages/smartcity-overview-page.html',
    security: 'partials/pages/smartcity-security-page.html',
    reports: 'partials/pages/smartcity-reports-page.html',
  },
  hydrateAllPages,
  onNavigate,
}).then(() => {
  bindHudTabs();
}).catch(console.error);
