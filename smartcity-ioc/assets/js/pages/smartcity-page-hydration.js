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
import { renderSmartcityDomainLeft, renderSmartcityDomainRight } from '../render/smartcity-domain-command-panels.js';
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
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('environment');
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('environment');
    },
    utilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('utilities');
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('utilities');
    },
    reports: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('reports');
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('reports');
    },
  };

  if (mounts[pageId]) mounts[pageId]();
}

export function hydrateAllPages() {
  ['overview', 'traffic', 'security', 'environment', 'utilities', 'reports'].forEach(hydratePage);
}
