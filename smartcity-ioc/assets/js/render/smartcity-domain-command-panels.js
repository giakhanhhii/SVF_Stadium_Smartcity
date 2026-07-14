// Aggregator cho 3 trang domain (environment/utilities/reports): giữ nguyên API
// renderSmartcityDomainLeft/Right + bind* cho hydration; panel thật nằm trong
// smartcity-{environment,utilities,reports}-panels.js.
import { domainPanelsData } from '../data/smartcity-domain-panels-data.js';
import {
  pipeInfrastructurePanel,
  environmentNetwork,
  environmentThermalMap,
  infrastructureHealthSnapshot,
  environmentLoadMatrix,
  pcccFireRiskNetwork,
  environmentRadar,
  constructionBuildingsPanel,
  infrastructureAlertsPanel,
  bindInfrastructureOpsModal,
} from './smartcity-environment-panels.js';
import {
  utilityResidentHero,
  utilityNodeMap,
  utilityServiceMap,
  utilityFlow,
  utilityLoadTowers,
  utilityRulesRadar,
  utilityVinStandard,
  utilityServiceAlertsChart,
  bindVinServiceModal,
} from './smartcity-utilities-panels.js';
import {
  reportSummary,
  reportTimeline,
  reportResolution,
  reportIncidentMatrix,
  reportOverviewMap,
  reportSensorChart,
  smartcityReportSendCard,
  smartcityManagementAdviceCard,
  bindSmartcityReportHistory,
} from './smartcity-reports-panels.js';

const pageRenderers = {
  environment: {
    left: (data) => [
      pipeInfrastructurePanel(data.pipeInfra),
      environmentNetwork(data.hotspots),
      environmentThermalMap(data.opsCard),
      infrastructureHealthSnapshot(data.healthSnapshot),
      environmentLoadMatrix(data.slaMatrix),
    ].join(''),
    right: (data) => [
      pcccFireRiskNetwork(data.fireRiskNetwork),
      environmentRadar(data.pcccCard),
      constructionBuildingsPanel(data.construction),
      infrastructureAlertsPanel(data.alertRadar),
    ].join(''),
  },
  utilities: {
    left: (data) => [
      utilityResidentHero(data.residentHero),
      utilityNodeMap(data.nodeMap),
      utilityServiceMap(data.serviceMap),
      utilityFlow(data.flow),
    ].join(''),
    right: (data) => [
      utilityLoadTowers(data.loadTowers),
      utilityRulesRadar(data.rulesRadar),
      utilityVinStandard(data.vinStandard),
      utilityServiceAlertsChart(data.serviceAlerts),
    ].join(''),
  },
  reports: {
    left: (data) => [
      reportSummary(data.summary),
      reportTimeline(data.timeline),
      reportResolution(data.resolution),
      reportIncidentMatrix(data.incidentMatrix),
    ].join(''),
    right: (data) => [
      reportOverviewMap(data.overviewMap),
      reportSensorChart(data.sensorChart),
      smartcityReportSendCard(data.sendCard),
      smartcityManagementAdviceCard(data.adviceCard),
    ].join(''),
  },
};

export function renderSmartcityDomainLeft(pageId, data = domainPanelsData[pageId]) {
  return (data && pageRenderers[pageId]?.left(data)) || '';
}

export function renderSmartcityDomainRight(pageId, data = domainPanelsData[pageId]) {
  return (data && pageRenderers[pageId]?.right(data)) || '';
}

export { bindInfrastructureOpsModal, bindVinServiceModal, bindSmartcityReportHistory };
