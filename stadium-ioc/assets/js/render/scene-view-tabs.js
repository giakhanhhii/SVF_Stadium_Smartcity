import { applyPageView } from '../scene/index.js';

const VIEWS = {
  overview: [
    { id: 'overview', label: 'Tổng thể' },
    { id: 'facilities', label: 'Mái vòm' },
    { id: 'events', label: 'Sân cỏ' },
  ],
  security: [
    { id: 'security', label: 'An ninh' },
    { id: 'overview', label: 'Tổng thể' },
  ],
  events: [
    { id: 'events', label: 'Sân cỏ' },
    { id: 'overview', label: 'Tổng thể' },
  ],
  facilities: [
    { id: 'facilities', label: 'Mái vòm' },
    { id: 'overview', label: 'Tổng thể' },
  ],
  services: [
    { id: 'services', label: 'Bãi đỗ' },
    { id: 'overview', label: 'Tổng thể' },
  ],
};

export function renderViewTabs(pageId) {
  const views = VIEWS[pageId] || VIEWS.overview;
  return views.map((v, i) =>
    `<button type="button" class="scene-view-tab${i === 0 ? ' scene-view-tab--active' : ''}" data-scene-view="${v.id}">${v.label}</button>`,
  ).join('');
}

export function bindViewTabs(pageId) {
  const root = document.querySelector(`#page-${pageId}`);
  if (!root) return;
  root.querySelectorAll('[data-scene-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.scene-view-tab').forEach((b) => b.classList.remove('scene-view-tab--active'));
      btn.classList.add('scene-view-tab--active');
      const viewId = btn.dataset.sceneView;
      const container = root.querySelector('[data-mount="stadium-scene"]');
      applyPageView(viewId, container);
    });
  });
}
