import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { bindHudTabs } from '../../../shared-ioc/assets/js/render/hud-tabs.js';
import { hydrateAllPages } from './pages/smartcity-page-hydration.js';
import { initPageCharts } from './charts/smartcity-chart-registry.js';
import { initPageScenes } from './scene/smartcity-scene-registry.js?v=roundabout-replay-20260619b';
import { mountSmartcitySideNav } from './render/smartcity-side-nav.js';
import { initSidebarResize } from '../../../shared-ioc/assets/js/render/sidebar-resize.js';
import { initHudBlockDrag } from '../../../shared-ioc/assets/js/render/hud-block-drag.js';

const SMARTCITY_INTERACTION_SCOPE = { storageNamespace: 'smartcity' };

function onNavigate(pageId) {
  initPageCharts(pageId);
  initPageScenes(pageId);
  initSidebarResize(pageId, SMARTCITY_INTERACTION_SCOPE);
  initHudBlockDrag(document.getElementById(`page-${pageId}`) || document, SMARTCITY_INTERACTION_SCOPE);
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
  mountSmartcitySideNav('overview');
  onNavigate('overview');
}).catch(console.error);
