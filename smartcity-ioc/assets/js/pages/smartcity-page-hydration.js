import { renderDomainBanner, renderDomainKpiRow } from '../../../../shared-ioc/assets/js/render/domain.js';
import { renderAlertList, renderSeverityRow } from '../../../../shared-ioc/assets/js/render/alerts.js';
import { renderChartSection } from '../../../../shared-ioc/assets/js/render/chart-section.js';
import { renderTeamList, renderStationList } from '../../../../shared-ioc/assets/js/render/team-station.js';
import {
  renderVitals, renderKpiGrid, renderModules, renderMiniStats,
  renderReportTable, renderReportCategories,
} from '../../../../shared-ioc/assets/js/render/shared-overview-render.js';
import { renderTrafficLeftSidebar } from '../render/traffic-panels-left.js';
import { renderTrafficRightSidebar } from '../render/traffic-panels-right.js';
import { renderLeftSidebar } from '../render/security-panels-left.js';
import { renderRightSidebar } from '../render/security-panels-right.js';
import { overviewData } from '../data/smartcity-overview-data.js';
import { trafficData } from '../data/traffic.js';
import { securityData } from '../data/smartcity-security-data.js';
import { environmentData } from '../data/environment.js';
import { utilitiesData } from '../data/utilities.js';
import { reportsData } from '../data/smartcity-reports-data.js';

export function hydratePage(pageId) {
  const root = document.getElementById('page-' + pageId);
  if (!root) return;

  const mounts = {
    overview: () => {
      root.querySelector('[data-mount="vitals"]').innerHTML = renderVitals(overviewData.vitals);
      root.querySelector('[data-mount="kpis"]').innerHTML = renderKpiGrid(overviewData.kpis);
      root.querySelector('[data-mount="modules"]').innerHTML = renderModules(overviewData.modules);
    },
    traffic: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderTrafficLeftSidebar(trafficData.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderTrafficRightSidebar(trafficData.right);
    },
    security: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderLeftSidebar(securityData.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderRightSidebar(securityData.right);
    },
    environment: () => {
      root.querySelector('[data-mount="banner"]').outerHTML = renderDomainBanner(environmentData.banner);
      root.querySelector('[data-mount="kpis"]').outerHTML = renderDomainKpiRow(environmentData.kpis);
      root.querySelector('[data-mount="mini-stats"]').innerHTML = renderMiniStats(environmentData.miniStats);
      root.querySelector('[data-mount="stations"]').innerHTML = renderStationList(environmentData.stations);
      root.querySelector('[data-mount="chart"]').outerHTML = renderChartSection(environmentData.chart);
    },
    utilities: () => {
      root.querySelector('[data-mount="banner"]').outerHTML = renderDomainBanner(utilitiesData.banner);
      root.querySelector('[data-mount="kpis"]').outerHTML = renderDomainKpiRow(utilitiesData.kpis);
    },
    reports: () => {
      const banner = root.querySelector('[data-mount="banner"]');
      if (banner) banner.innerHTML = renderDomainBanner(reportsData.banner, true);
      const kpis = root.querySelector('[data-mount="kpis"]');
      if (kpis) kpis.outerHTML = renderDomainKpiRow(reportsData.kpis);
      const cats = root.querySelector('[data-mount="categories"]');
      if (cats) cats.innerHTML = renderReportCategories(reportsData.categories);
      const tbody = root.querySelector('[data-mount="table-body"]');
      if (tbody) tbody.innerHTML = renderReportTable(reportsData.rows);
      const chart = root.querySelector('[data-mount="chart"]');
      if (chart) chart.outerHTML = renderChartSection(reportsData.chart);
    },
  };

  if (mounts[pageId]) mounts[pageId]();
}

export function hydrateAllPages() {
  ['overview', 'traffic', 'security', 'environment', 'utilities', 'reports'].forEach(hydratePage);
}
