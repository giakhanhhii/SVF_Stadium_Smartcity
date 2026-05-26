import { applyPageView } from '../scene/index.js';
import { isSecurityInteriorActive, feedToViewId } from '../scene/stadium-security-interior.js';
const VIEWS = {
  overview: [
    { id: 'overview', label: 'Tổng thể' },
    { id: 'facilities', label: 'Mái vòm' },
    { id: 'events', label: 'Sân cỏ' },
  ],
  security: [
    { id: 'security', label: 'Trong sân' },
    { id: 'overview', label: 'Ngoài sân' },
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

let securityViewSyncBound = false;

export function bindViewTabs(pageId) {
  const root = document.querySelector(`#page-${pageId}`);
  if (!root) return;

  if (pageId === 'security' && !securityViewSyncBound) {
    securityViewSyncBound = true;
    document.addEventListener('voc-security-view-changed', (e) => {
      const secRoot = document.querySelector('#page-security');
      if (secRoot?.isConnected) {
        const viewId = e.detail === 'exterior' ? 'overview' : 'security';
        secRoot.querySelectorAll('[data-scene-view]').forEach((btn) => {
          btn.classList.toggle('scene-view-tab--active', btn.dataset.sceneView === viewId);
        });
      }
    });
  }

  root.querySelectorAll('[data-scene-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.scene-view-tab').forEach((b) => b.classList.remove('scene-view-tab--active'));
      btn.classList.add('scene-view-tab--active');
      const viewId = btn.dataset.sceneView;
      if (pageId === 'security' && isSecurityInteriorActive()) {
        document.dispatchEvent(new CustomEvent('voc-open-stadium-screen', {
          detail: feedToViewId(viewId === 'overview' ? 'exterior' : 'interior'),
        }));
        return;
      }      const container = root.querySelector('[data-mount="stadium-scene"]');
      applyPageView(viewId, container);
    });
  });
}
