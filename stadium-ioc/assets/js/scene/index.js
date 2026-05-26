import { initStadiumScene, disposeStadiumScene } from './stadium-scene.js';

let currentPage = null;
const SCENE_PAGES = new Set(['overview', 'security', 'events', 'facilities', 'services']);

export function initPageScenes(pageId) {
  const wasScene = currentPage && SCENE_PAGES.has(currentPage);
  const isScene = SCENE_PAGES.has(pageId);

  if (wasScene && !isScene) disposeStadiumScene();
  else if (isScene) initStadiumScene(pageId);

  currentPage = pageId;
}

export { setRoofProgress, getRoofProgress, applyPageView } from './stadium-scene.js';
