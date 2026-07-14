import { renderOverviewLeft, renderOverviewRight, mountOverviewOpsBind } from '../render/stadium-overview-hud-render.js';
import {
  renderSecurityLeft, renderSecurityRight, renderSecurityExteriorLeft, renderSecurityExteriorRight,
  bindSecurityHudTabs, bindSecurityExteriorHudTabs,
} from '../render/stadium-security-hud-render.js';
import { renderEventsLeft, renderEventsRight, bindEventsHudTabs } from '../render/stadium-events-hud-render.js';
import { renderFacilitiesLeft, renderFacilitiesRight, bindFacilitiesActions } from '../render/stadium-facilities-hud-render.js';
import { renderServicesLeft, renderServicesRight, bindServicesHudTabs } from '../render/stadium-services-hud-render.js';
import { renderReportsLeft, renderReportsRight, bindReportsHistory } from '../render/reports-hud.js';
import { renderViewTabs } from '../render/scene-view-tabs.js';
import { initHudBlockDrag } from '../../../../shared-ioc/assets/js/render/hud-block-drag.js';
import { getData, subscribe } from '../services/data-service.js';

const STADIUM_INTERACTION_SCOPE = { storageNamespace: 'stadium' };
const PAGE_IDS = ['overview', 'security', 'events', 'facilities', 'services', 'reports'];

function renderSecuritySidebars(root, securityData, mode = 'interior') {
  const left = root.querySelector('.sidebar-hud[data-mount="sidebar-left"]');
  const right = root.querySelector('.sidebar-hud[data-mount="sidebar-right"]');
  const legend = root.querySelector('.security-center__legend');
  root.classList.toggle('security-exterior-mode', mode === 'exterior');
  root.classList.toggle('security-interior-mode', mode !== 'exterior');
  if (mode === 'exterior') {
    if (left) left.innerHTML = renderSecurityExteriorLeft(securityData.exterior.left);
    if (right) right.innerHTML = renderSecurityExteriorRight(securityData.exterior.right);
    bindSecurityExteriorHudTabs(root, securityData.exterior);
  } else {
    if (left) left.innerHTML = renderSecurityLeft(securityData.interior.left);
    if (right) right.innerHTML = renderSecurityRight(securityData.interior.right);
    bindSecurityHudTabs(root, securityData.interior);
  }
  if (legend) {
    const items = securityData.legend[mode] || securityData.legend.interior;
    legend.innerHTML = items.map((item) =>
      `<span class="legend-item"><span class="legend-dot" style="background:${item.color}"></span>${item.label}</span>`,
    ).join('');
  }
  initHudBlockDrag(root, STADIUM_INTERACTION_SCOPE);
}

export async function hydrateSecuritySidebars(mode = 'interior') {
  const root = document.getElementById('page-security');
  if (!root) return;
  const securityData = await getData('security');
  renderSecuritySidebars(root, securityData, mode);
}

function renderPage(root, pageId, data) {
  const mounts = {
    overview: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderOverviewLeft(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderOverviewRight(data.right);
      mountOverviewOpsBind(root);
    },
    security: () => {
      renderSecuritySidebars(root, data, 'interior');
    },
    events: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderEventsLeft(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderEventsRight(data.right);
      bindEventsHudTabs(root, data);
    },
    facilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderFacilitiesLeft(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderFacilitiesRight(data.right);
      bindFacilitiesActions(root);
    },
    services: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderServicesLeft(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderServicesRight(data.right);
      bindServicesHudTabs(root, data);
    },
    reports: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderReportsLeft(data);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderReportsRight(data);
      bindReportsHistory(root);
    },
  };

  if (mounts[pageId]) mounts[pageId]();
  const tabs = root.querySelector('[data-mount="view-tabs"]');
  if (tabs) tabs.innerHTML = renderViewTabs(pageId);
  initHudBlockDrag(root, STADIUM_INTERACTION_SCOPE);
}

const subscribedPages = new Set();

function ensureSubscription(pageId) {
  if (subscribedPages.has(pageId)) return;
  subscribedPages.add(pageId);
  subscribe(pageId, (data) => {
    const root = document.getElementById('page-' + pageId);
    if (root) renderPage(root, pageId, data);
  });
}

export async function hydratePage(pageId) {
  const root = document.getElementById('page-' + pageId);
  if (!root) return;
  const data = await getData(pageId);
  renderPage(root, pageId, data);
  ensureSubscription(pageId);
}

export async function hydrateAllPages() {
  await Promise.all(PAGE_IDS.map(hydratePage));
}

document.addEventListener('voc-security-view-changed', (event) => {
  const root = document.getElementById('page-security');
  if (!root?.classList.contains('active')) return;
  hydrateSecuritySidebars(event.detail === 'exterior' ? 'exterior' : 'interior');
});

document.addEventListener('stadium-report-history-updated', () => {
  hydratePage('reports');
});
