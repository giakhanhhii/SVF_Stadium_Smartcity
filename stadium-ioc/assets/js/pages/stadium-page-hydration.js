import { renderOverviewLeft, renderOverviewRight, mountOverviewOpsBind } from '../render/stadium-overview-hud-render.js';
import {
  renderSecurityLeft, renderSecurityRight, renderSecurityExteriorLeft, renderSecurityExteriorRight,
  bindSecurityHudTabs, bindSecurityExteriorHudTabs,
} from '../render/stadium-security-hud-render.js';
import { renderEventsLeft, renderEventsRight, bindEventsHudTabs } from '../render/stadium-events-hud-render.js';
import { renderFacilitiesLeft, renderFacilitiesRight, bindFacilitiesActions } from '../render/stadium-facilities-hud-render.js';
import { renderServicesLeft, renderServicesRight, bindServicesHudTabs } from '../render/stadium-services-hud-render.js';
import { renderReportsLeft, renderReportsRight, bindReportsHistory } from '../render/reports-hud.js';
import { overviewHud } from '../data/stadium-overview-hud-data.js';
import { securityHud } from '../data/stadium-security-hud-data.js';
import { securityExteriorHud, SECURITY_LEGEND } from '../data/security-exterior-hud.js';
import { eventsHud } from '../data/stadium-events-hud-data.js';
import { facilitiesHud } from '../data/stadium-facilities-hud-data.js';
import { servicesHud } from '../data/stadium-services-hud-data.js';
import { reportsData } from '../data/stadium-reports-data.js';
import { renderViewTabs } from '../render/scene-view-tabs.js';
import { initHudBlockDrag } from '../render/hud-block-drag.js';

export function hydrateSecuritySidebars(mode = 'interior') {
  const root = document.getElementById('page-security');
  if (!root) return;
  const left = root.querySelector('.sidebar-hud[data-mount="sidebar-left"]');
  const right = root.querySelector('.sidebar-hud[data-mount="sidebar-right"]');
  const legend = root.querySelector('.security-center__legend');
  root.classList.toggle('security-exterior-mode', mode === 'exterior');
  root.classList.toggle('security-interior-mode', mode !== 'exterior');
  if (mode === 'exterior') {
    if (left) left.innerHTML = renderSecurityExteriorLeft(securityExteriorHud.left);
    if (right) right.innerHTML = renderSecurityExteriorRight(securityExteriorHud.right);
    bindSecurityExteriorHudTabs(root, securityExteriorHud);
  } else {
    if (left) left.innerHTML = renderSecurityLeft(securityHud.left);
    if (right) right.innerHTML = renderSecurityRight(securityHud.right);
    bindSecurityHudTabs(root, securityHud);
  }
  if (legend) {
    const items = SECURITY_LEGEND[mode] || SECURITY_LEGEND.interior;
    legend.innerHTML = items.map((item) =>
      `<span class="legend-item"><span class="legend-dot" style="background:${item.color}"></span>${item.label}</span>`,
    ).join('');
  }
  initHudBlockDrag(root);
}

export function hydratePage(pageId) {
  const root = document.getElementById('page-' + pageId);
  if (!root) return;

  const mounts = {
    overview: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderOverviewLeft(overviewHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderOverviewRight(overviewHud.right);
      mountOverviewOpsBind(root);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('overview');
    },
    security: () => {
      hydrateSecuritySidebars('interior');
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('security');
    },
    events: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderEventsLeft(eventsHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderEventsRight(eventsHud.right);
      bindEventsHudTabs(root, eventsHud);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('events');
    },
    facilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderFacilitiesLeft(facilitiesHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderFacilitiesRight(facilitiesHud.right);
      bindFacilitiesActions(root);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('facilities');
    },
    services: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderServicesLeft(servicesHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderServicesRight(servicesHud.right);
      bindServicesHudTabs(root, servicesHud);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('services');
    },
    reports: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderReportsLeft(reportsData);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderReportsRight(reportsData);
      bindReportsHistory(root);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('reports');
    },
  };

  if (mounts[pageId]) mounts[pageId]();
  initHudBlockDrag(root);
}

export function hydrateAllPages() {
  ['overview', 'security', 'events', 'facilities', 'services', 'reports'].forEach(hydratePage);
}

document.addEventListener('voc-security-view-changed', (event) => {
  const root = document.getElementById('page-security');
  if (!root?.classList.contains('active')) return;
  hydrateSecuritySidebars(event.detail === 'exterior' ? 'exterior' : 'interior');
});
