import { initSecurityBuildingScene, disposeSecurityBuildingScene } from './security-building-scene.js';
import { initTrafficRoadScene, disposeTrafficRoadScene } from './traffic-road-scene.js';

let currentPage = null;

const disposers = {
  security: disposeSecurityBuildingScene,
  traffic: disposeTrafficRoadScene,
};

export const sceneRegistry = {
  security: initSecurityBuildingScene,
  traffic: initTrafficRoadScene,
};

export function initPageScenes(pageId) {
  if (currentPage && currentPage !== pageId && disposers[currentPage]) {
    disposers[currentPage]();
  }
  currentPage = pageId;
  const init = sceneRegistry[pageId];
  if (init) init();
}
