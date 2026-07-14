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
  bindSmartcityReportHistory,
  bindVinServiceModal,
  renderSmartcityDomainLeft,
  renderSmartcityDomainRight,
} from '../render/smartcity-domain-command-panels.js';
import {
  renderSmartcityOverviewLeft,
  renderSmartcityOverviewRight,
} from '../render/smartcity-overview-hud-render.js';
import { getData, subscribe } from '../services/data-service.js';

const PAGE_IDS = ['overview', 'traffic', 'security', 'environment', 'utilities', 'reports'];

function renderPage(root, pageId, data) {
  const mounts = {
    overview: () => {
      root.querySelector('[data-mount="overview-left"]').innerHTML = renderSmartcityOverviewLeft(data);
      root.querySelector('[data-mount="overview-right"]').innerHTML = renderSmartcityOverviewRight(data);
    },
    traffic: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderTrafficLeftSidebar(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderTrafficRightSidebar(data.right);
    },
    security: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderLeftSidebar(data.left);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderRightSidebar(data.right);
    },
    environment: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('environment', data);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('environment', data);
      bindInfrastructureOpsModal();
    },
    utilities: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('utilities', data);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('utilities', data);
      bindVinServiceModal();
    },
    reports: () => {
      root.querySelector('[data-mount="sidebar-left"]').innerHTML = renderSmartcityDomainLeft('reports', data);
      root.querySelector('[data-mount="sidebar-right"]').innerHTML = renderSmartcityDomainRight('reports', data);
      bindSmartcityReportHistory();
    },
  };

  if (mounts[pageId]) mounts[pageId]();
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
  bindTrafficCameraModal();
  bindSecurityModeTabs();
  bindRiskZoneTabs();
  bindSmartcityDeviceControls();
  bindSmartcityFireExitControls();
  bindRedLightModal();
  bindTrafficKpiControls();
  bindTrafficFlowControls();
  bindTrafficSignalControls();
  bindInfrastructureOpsModal();
  bindSmartcityReportHistory();
}
