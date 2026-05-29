import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { bindHudTabs } from '../../../shared-ioc/assets/js/render/hud-tabs.js';
import { hydrateAllPages } from './pages/init.js';
import { initPageCharts } from './charts/index.js';
import { initPageScenes } from './scene/index.js';

function onNavigate(pageId) {
  initPageCharts(pageId);
  initPageScenes(pageId);
}

createApp({
  pageIds: ['overview', 'traffic', 'security', 'environment', 'utilities', 'reports'],
  shellPath: 'partials/shell/header.html',
  hydrateAllPages,
  onNavigate,
}).then(() => {
  bindHudTabs();
}).catch(console.error);
