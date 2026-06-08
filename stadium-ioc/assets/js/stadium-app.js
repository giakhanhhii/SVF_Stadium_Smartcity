import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { navigateTo } from '../../../shared-ioc/assets/js/router.js';
import { hydrateAllPages } from './pages/stadium-page-hydration.js';
import { initPageCharts } from './charts/stadium-chart-registry.js';
import { initPageScenes } from './scene/stadium-scene-registry.js';
import {
  initControlRoomUI, activateSecurityTab, deactivateSecurityTab, setNavHandler,
} from './render/control-room-ui.js';
import { bindViewTabs } from './render/scene-view-tabs.js';
import { bindHudTabs } from '../../../shared-ioc/assets/js/render/hud-tabs.js';
import { mountStadiumSideNav } from './render/side-nav.js';
import { initSidebarResize } from './render/sidebar-resize.js';

const SCENE_PAGES = new Set(['overview', 'security', 'events', 'facilities', 'services', 'reports']);
let currentPage = 'overview';

function onNavigate(pageId) {
  if (currentPage === 'security' && pageId !== 'security') deactivateSecurityTab();

  initPageCharts(pageId);
  initPageScenes(pageId);

  if (pageId === 'overview') initControlRoomUI('overview');
  if (pageId === 'security') activateSecurityTab();
  if (SCENE_PAGES.has(pageId)) bindViewTabs(pageId);
  if (SCENE_PAGES.has(pageId)) initSidebarResize(pageId);

  currentPage = pageId;
}

setNavHandler(onNavigate);

document.addEventListener('stadium-overview-fire-auto-request', () => {
  navigateTo('events', onNavigate);
  window.setTimeout(() => {
    document.querySelector('#page-events [data-fire-auto-chain]')?.click();
  }, 120);
});

createApp({
  pageIds: ['overview', 'security', 'events', 'facilities', 'services', 'reports'],
  shellPath: 'partials/shell/stadium-header.html',
  pagePaths: {
    overview: 'partials/pages/stadium-overview-page.html',
    security: 'partials/pages/stadium-security-page.html',
    reports: 'partials/pages/stadium-reports-page.html',
  },
  hydrateAllPages,
  onNavigate,
}).then(() => {
  bindHudTabs();
  mountStadiumSideNav('overview');
  onNavigate('overview');
}).catch(console.error);
