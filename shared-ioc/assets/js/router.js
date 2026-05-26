export function navigateTo(pageId, onAfterNavigate) {
  document.querySelectorAll('.page-view').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const navBtn = document.querySelector(`.nav-item[data-nav="${pageId}"]`);
  if (navBtn) navBtn.classList.add('active');
  if (onAfterNavigate) onAfterNavigate(pageId);
}

export function bindRouter(onNavigate) {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-nav]');
    if (!trigger || trigger.tagName === 'A') return;
    e.preventDefault();
    navigateTo(trigger.dataset.nav, onNavigate);
  });
}

export function bindTimeTabs() {
  document.querySelectorAll('.time-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      tab.closest('.time-tabs').querySelectorAll('.time-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}
