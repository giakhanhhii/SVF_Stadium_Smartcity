import { bindRouter, bindTimeTabs } from './router.js';

export async function loadPartial(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.text();
}

export async function createApp({ pageIds, shellPath, hydrateAllPages, onNavigate }) {
  const header = await loadPartial(shellPath);
  document.getElementById('app-shell').insertAdjacentHTML('afterbegin', header);

  const root = document.getElementById('app-pages');
  const html = await Promise.all(pageIds.map((id) => loadPartial(`partials/pages/${id}.html`)));
  root.innerHTML = html.join('');

  if (hydrateAllPages) hydrateAllPages();
  bindRouter(onNavigate);
  bindTimeTabs();
}
