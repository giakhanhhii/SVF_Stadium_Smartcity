import { renderOverviewLeft, renderOverviewRight, mountOverviewOpsBind } from '../render/overview-hud.js';
import { renderSecurityLeft, renderSecurityRight, renderSecurityExteriorLeft, renderSecurityExteriorRight } from '../render/security-hud.js';
import { renderEventsLeft, renderEventsRight } from '../render/events-hud.js';
import { renderFacilitiesLeft, renderFacilitiesRight } from '../render/facilities-hud.js';
import { renderServicesLeft, renderServicesRight } from '../render/services-hud.js';
import { renderReportsLeft, renderReportsRight, bindReportsHistory } from '../render/reports-hud.js';
import { overviewHud } from '../data/overview-hud.js';
import { securityHud } from '../data/security-hud.js';
import { securityExteriorHud, SECURITY_LEGEND } from '../data/security-exterior-hud.js';
import { eventsHud } from '../data/events-hud.js';
import { facilitiesHud } from '../data/facilities-hud.js';
import { servicesHud } from '../data/services-hud.js';
import { reportsData } from '../data/reports.js';
import { renderViewTabs } from '../render/scene-view-tabs.js';

export function hydrateSecuritySidebars(mode = 'interior') {
  const root = document.getElementById('page-security');
  if (!root) return;
  const left = root.querySelector('.sidebar-hud[data-mount="sidebar-left"]');
  const right = root.querySelector('.sidebar-hud[data-mount="sidebar-right"]');
  const legend = root.querySelector('.security-center__legend');
  if (mode === 'exterior') {
    if (left) left.innerHTML = renderSecurityExteriorLeft(securityExteriorHud.left);
    if (right) right.innerHTML = renderSecurityExteriorRight(securityExteriorHud.right);
  } else {
    if (left) left.innerHTML = renderSecurityLeft(securityHud.left);
    if (right) right.innerHTML = renderSecurityRight(securityHud.right);
  }
  if (legend) {
    const items = SECURITY_LEGEND[mode] || SECURITY_LEGEND.interior;
    legend.innerHTML = items.map((item) =>
      `<span class="legend-item"><span class="legend-dot" style="background:${item.color}"></span>${item.label}</span>`,
    ).join('');
  }
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
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('events');
    },
    facilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderFacilitiesLeft(facilitiesHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderFacilitiesRight(facilitiesHud.right);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('facilities');
    },
    services: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderServicesLeft(servicesHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderServicesRight(servicesHud.right);
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
}

export function hydrateAllPages() {
  ['overview', 'security', 'events', 'facilities', 'services', 'reports'].forEach(hydratePage);
}
