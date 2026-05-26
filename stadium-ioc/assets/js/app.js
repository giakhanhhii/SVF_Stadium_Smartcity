import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { hydrateAllPages } from './pages/init.js';
import { initPageCharts } from './charts/index.js';
import { initPageScenes } from './scene/index.js';
import { bindViewTabs } from './render/scene-view-tabs.js';

const SCENE_PAGES = new Set(['overview', 'security', 'events', 'facilities', 'services']);

function onNavigate(pageId) {
  initPageCharts(pageId);
  initPageScenes(pageId);
  if (SCENE_PAGES.has(pageId)) bindViewTabs(pageId);
}

createApp({
  pageIds: ['overview', 'security', 'events', 'facilities', 'services', 'reports'],
  shellPath: 'partials/shell/header.html',
  hydrateAllPages,
  onNavigate,
}).then(() => onNavigate('overview')).catch(console.error);
