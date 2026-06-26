import { initSmartcityScene, disposeSmartcityScene } from './smartcity-scene-runtime.js?v=pipe-reveal-20260626e';

let currentPage = null;

const SCENE_PAGES = new Set(['overview', 'traffic', 'security', 'environment', 'utilities', 'reports']);

export function initPageScenes(pageId) {
  const wasScene = currentPage && SCENE_PAGES.has(currentPage);
  const isScene = SCENE_PAGES.has(pageId);

  if (wasScene && !isScene) disposeSmartcityScene();
  else if (isScene) initSmartcityScene(pageId);

  currentPage = pageId;
}

export { applyPageView } from './smartcity-scene-runtime.js?v=pipe-reveal-20260626e';
