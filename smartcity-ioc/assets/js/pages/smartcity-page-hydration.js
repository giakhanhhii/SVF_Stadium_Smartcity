import { renderTrafficLeftSidebar, bindTrafficCameraModal } from '../render/traffic-panels-left.js';
import {
  renderTrafficRightSidebar,
  bindTrafficKpiControls,
  bindTrafficFlowControls,
  bindTrafficSignalControls,
} from '../render/traffic-panels-right.js';
import { bindRedLightModal } from '../render/traffic-violations.js';
import { bindSecurityModeTabs, renderLeftSidebar } from '../render/security-panels-left.js';
import {
  bindRiskZoneTabs,
  bindSmartcityDeviceControls,
  bindSmartcityFireExitControls,
  renderRightSidebar,
} from '../render/security-panels-right.js';
import {
  bindInfrastructureOpsModal,
  bindVinServiceModal,
  renderSmartcityDomainLeft,
  renderSmartcityDomainRight,
} from '../render/smartcity-domain-command-panels.js';
import {
  renderSmartcityOverviewLeft,
  renderSmartcityOverviewRight,
} from '../render/smartcity-overview-hud-render.js';
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
      root.querySelector('[data-mount="overview-left"]').innerHTML = renderSmartcityOverviewLeft(overviewData);
      root.querySelector('[data-mount="overview-right"]').innerHTML = renderSmartcityOverviewRight(overviewData);
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
      bindInfrastructureOpsModal();
    },
    utilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('utilities');
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('utilities');
      bindVinServiceModal();
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
  bindTrafficCameraModal();
  bindSecurityModeTabs();
  bindRiskZoneTabs();
  bindSmartcityDeviceControls();
  bindSmartcityFireExitControls();
  bindRedLightModal();
  bindTrafficKpiControls();
  bindTrafficFlowControls();
  bindTrafficSignalControls();
}
