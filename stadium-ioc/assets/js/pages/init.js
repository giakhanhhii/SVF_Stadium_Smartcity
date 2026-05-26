import {
  renderModules, renderReportTable, renderReportCategories,
} from '../../../../shared-ioc/assets/js/render/overview.js';
import { renderDomainBanner, renderDomainKpiRow } from '../../../../shared-ioc/assets/js/render/domain.js';
import { renderChartSection } from '../../../../shared-ioc/assets/js/render/chart-section.js';
import { renderOverviewLeft, renderOverviewRight } from '../render/overview-hud.js';
import { renderSecurityLeft, renderSecurityRight } from '../render/security-hud.js';
import { renderEventsLeft, renderEventsRight } from '../render/events-hud.js';
import { renderFacilitiesLeft, renderFacilitiesRight } from '../render/facilities-hud.js';
import { renderServicesLeft, renderServicesRight } from '../render/services-hud.js';
import { overviewData } from '../data/overview.js';
import { overviewHud } from '../data/overview-hud.js';
import { securityHud } from '../data/security-hud.js';
import { eventsHud } from '../data/events-hud.js';
import { facilitiesHud } from '../data/facilities-hud.js';
import { servicesHud } from '../data/services-hud.js';
import { reportsData } from '../data/reports.js';
import { renderViewTabs } from '../render/scene-view-tabs.js';

export function hydratePage(pageId) {
  const root = document.getElementById('page-' + pageId);
  if (!root) return;

  const mounts = {
    overview: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderOverviewLeft(overviewHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderOverviewRight(overviewHud.right);
      root.querySelector('[data-mount="modules"]').innerHTML = renderModules(overviewData.modules);
      const tabs = root.querySelector('[data-mount="view-tabs"]');
      if (tabs) tabs.innerHTML = renderViewTabs('overview');
    },
    security: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSecurityLeft(securityHud.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSecurityRight(securityHud.right);
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
      const banner = root.querySelector('[data-mount="banner"]');
      if (banner) banner.outerHTML = renderDomainBanner(reportsData.banner);
      const kpis = root.querySelector('[data-mount="kpis"]');
      if (kpis) kpis.outerHTML = renderDomainKpiRow(reportsData.kpis);
      root.querySelector('[data-mount="categories"]').innerHTML = renderReportCategories(reportsData.categories);
      root.querySelector('[data-mount="table-body"]').innerHTML = renderReportTable(reportsData.rows);
      root.querySelector('[data-mount="chart"]').outerHTML = renderChartSection(reportsData.chart);
    },
  };

  if (mounts[pageId]) mounts[pageId]();
}

export function hydrateAllPages() {
  ['overview', 'security', 'events', 'facilities', 'services', 'reports'].forEach(hydratePage);
}
