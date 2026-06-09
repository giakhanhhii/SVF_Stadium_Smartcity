const NAV_LEFT = [
  { id: 'overview', label: 'Tổng quan', icon: 'ti-layout-dashboard' },
  { id: 'traffic', label: 'Giao thông', icon: 'ti-traffic-lights' },
  { id: 'security', label: 'An ninh', icon: 'ti-shield' },
];

const NAV_RIGHT = [
  { id: 'environment', label: 'Hạ tầng', icon: 'ti-building-estate' },
  { id: 'utilities', label: 'Dịch vụ', icon: 'ti-bolt' },
  { id: 'reports', label: 'Báo cáo', icon: 'ti-chart-bar' },
];

const NOTIFICATIONS = [
  { id: 'n1', source: 'Trung tâm IOC', title: 'Cảnh báo ùn tắc tại nút A4', detail: 'Điều phối ưu tiên đèn tín hiệu và camera AI trong 15 phút tới.', time: '2 phút' },
  { id: 'n2', source: 'Hạ tầng', title: 'Cảm biến khu B2 tăng ngưỡng', detail: 'Kích hoạt đội kỹ thuật kiểm tra hiện trường và đối chiếu dữ liệu cảm biến.', time: '8 phút' },
  { id: 'n3', source: 'An ninh', title: 'Sự cố camera khu C2 đã được gán đội ứng phó', detail: 'Đội #03 đang di chuyển, ETA 6 phút.', time: '12 phút' },
  { id: 'n4', source: 'Dịch vụ', title: 'Cụm đèn D5 cần lịch bảo trì nhanh', detail: 'Ticket #4821 đã tạo, ưu tiên xử lý trong ca trực hiện tại.', time: '18 phút' },
];

let notifyBound = false;

function navButtons(items) {
  return items.map((item) => `
    <button type="button" class="nav-item sidebar-nav__item" data-nav="${item.id}">
      <i class="ti ${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
    </button>
  `).join('');
}

export function renderSmartcitySideNavRail(side) {
  if (side === 'left') {
    return `<nav class="sidebar-nav sidebar-nav--left" aria-label="Điều hướng Smart City">
      <button type="button" class="sidebar-brand" data-nav="overview" aria-label="Về trang tổng quan">
        <span class="sidebar-brand__logo"><i class="ti ti-building-broadcast-tower" aria-hidden="true"></i></span>
        <span class="sidebar-brand__text">
          <span class="sidebar-brand__title">IOC Smart City</span>
          <span class="sidebar-brand__sub">Trung tâm điều hành thông minh</span>
        </span>
      </button>
      <div class="sidebar-nav__items">${navButtons(NAV_LEFT)}</div>
    </nav>`;
  }

  return `<nav class="sidebar-nav sidebar-nav--right" aria-label="Điều hướng phụ Smart City">
    <div class="sidebar-nav__items">${navButtons(NAV_RIGHT)}</div>
    <div class="sidebar-nav__actions">
      <a href="../stadium-ioc/stadium-index.html" class="sidebar-action sidebar-action--link" title="Chuyển sang IOC Sân vận động">
        <i class="ti ti-ball-football" aria-hidden="true"></i>
        <span>Sân vận động</span>
      </a>
      <button type="button" class="sidebar-action" aria-label="Thông báo" aria-expanded="false" data-smartcity-notify-toggle>
        <i class="ti ti-bell" aria-hidden="true"></i>
        <span>Thông báo</span>
        <span class="sidebar-action__badge">${NOTIFICATIONS.length}</span>
      </button>
    </div>
  </nav>`;
}

function renderNotificationModal() {
  const items = NOTIFICATIONS.map((n) => `
    <button type="button" class="sidebar-notify__item" data-smartcity-notify-item="${n.id}">
      <div class="sidebar-notify__top">
        <span class="sidebar-notify__source">${n.source}</span>
        <span class="sidebar-notify__time">${n.time}</span>
      </div>
      <div class="sidebar-notify__title">${n.title}</div>
      <div class="sidebar-notify__detail" data-smartcity-notify-detail="${n.id}" hidden>${n.detail}</div>
    </button>
  `).join('');

  return `<div class="sidebar-notify-modal" data-smartcity-notify-modal hidden>
    <div class="sidebar-notify-modal__panel" role="dialog" aria-modal="true" aria-label="Thông báo Smart City">
      <button type="button" class="sidebar-notify-modal__close" data-smartcity-notify-close aria-label="Đóng">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
      <div class="sidebar-notify__head">Thông báo điều hành Smart City</div>
      <div class="sidebar-notify__list">${items}</div>
    </div>
  </div>`;
}

function ensureNotificationModal() {
  if (document.querySelector('[data-smartcity-notify-modal]')) return;
  document.body.insertAdjacentHTML('beforeend', renderNotificationModal());
}

function bindNotificationPanel() {
  if (notifyBound) return;
  notifyBound = true;

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-smartcity-notify-toggle]');
    const item = e.target.closest('[data-smartcity-notify-item]');
    const closeBtn = e.target.closest('[data-smartcity-notify-close]');
    const modal = document.querySelector('[data-smartcity-notify-modal]');
    if (!modal) return;

    if (toggle) {
      modal.hidden = false;
      document.querySelectorAll('[data-smartcity-notify-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', btn === toggle ? 'true' : 'false');
      });
      return;
    }

    if (item) {
      const id = item.dataset.smartcityNotifyItem;
      const detail = item.querySelector(`[data-smartcity-notify-detail="${id}"]`);
      if (detail) detail.hidden = !detail.hidden;
      return;
    }

    if (closeBtn || e.target === modal) {
      modal.hidden = true;
      document.querySelectorAll('[data-smartcity-notify-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

export function mountSmartcitySideNav(activePageId = 'overview') {
  document.querySelectorAll('[data-side-nav-rail="left"]').forEach((el) => {
    el.outerHTML = renderSmartcitySideNavRail('left');
  });
  document.querySelectorAll('[data-side-nav-rail="right"]').forEach((el) => {
    el.outerHTML = renderSmartcitySideNavRail('right');
  });
  document.querySelectorAll(`.nav-item[data-nav="${activePageId}"]`).forEach((el) => {
    el.classList.add('active');
    el.setAttribute('aria-current', 'page');
  });
  ensureNotificationModal();
  bindNotificationPanel();
}
