let boundRoot = null;

function setActiveTab(tabsRoot, activeTab) {
  tabsRoot.querySelectorAll('.hud-tab').forEach((tab) => {
    const isActive = tab === activeTab;
    tab.classList.toggle('hud-tab--active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
}

function hydrateInitialStates(root) {
  root.querySelectorAll('.hud-tabs').forEach((tabsRoot) => {
    const tabs = [...tabsRoot.querySelectorAll('.hud-tab')];
    if (!tabs.length) return;
    const activeTab = tabs.find((tab) => tab.classList.contains('hud-tab--active')) || tabs[0];
    setActiveTab(tabsRoot, activeTab);
  });
}

export function bindHudTabs(root = document) {
  hydrateInitialStates(root);
  if (boundRoot === root) return;
  boundRoot = root;
  root.addEventListener('click', (event) => {
    const tab = event.target.closest?.('.hud-tab');
    if (!tab || !root.contains(tab)) return;
    const tabsRoot = tab.closest('.hud-tabs');
    if (!tabsRoot) return;
    setActiveTab(tabsRoot, tab);
  });
}
