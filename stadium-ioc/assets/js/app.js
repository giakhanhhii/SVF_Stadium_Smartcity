import { createApp } from '../../../shared-ioc/assets/js/bootstrap.js';
import { hydrateAllPages } from './pages/init.js';
import { initPageCharts } from './charts/index.js';
import { initPageScenes } from './scene/index.js';
import {
  initControlRoomUI, activateSecurityTab, deactivateSecurityTab, setNavHandler,
} from './render/control-room-ui.js';
import { bindViewTabs } from './render/scene-view-tabs.js';

const SCENE_PAGES = new Set(['overview', 'security', 'events', 'facilities', 'services']);
let currentPage = 'overview';

function onNavigate(pageId) {
  if (currentPage === 'security' && pageId !== 'security') deactivateSecurityTab();

  initPageCharts(pageId);
  initPageScenes(pageId);

  if (pageId === 'overview') initControlRoomUI('overview');
  if (pageId === 'security') activateSecurityTab();
  if (SCENE_PAGES.has(pageId)) bindViewTabs(pageId);

  currentPage = pageId;
}

setNavHandler(onNavigate);

createApp({
  pageIds: ['overview', 'security', 'events', 'facilities', 'services', 'reports'],
  shellPath: 'partials/shell/header.html',
  hydrateAllPages,
  onNavigate,
}).then(() => onNavigate('overview')).catch(console.error);
