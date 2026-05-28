const NAV_LEFT = [
  { id: 'overview', label: 'Tổng quan', icon: 'ti-layout-dashboard' },
  { id: 'security', label: 'An ninh', icon: 'ti-shield' },
  { id: 'events', label: 'Sự kiện', icon: 'ti-calendar-event' },
];

const NAV_RIGHT = [
  { id: 'facilities', label: 'Cơ sở hạ tầng', icon: 'ti-building-factory-2' },
  { id: 'services', label: 'Dịch vụ', icon: 'ti-tools' },
  { id: 'reports', label: 'Báo cáo', icon: 'ti-chart-bar' },
];

const NOTIFICATIONS = [
  {
    id: 'n1',
    source: 'Trung tâm Smart City',
    title: 'Yêu cầu phối hợp an ninh cổng Bắc',
    detail: 'Điều phối thêm 1 tổ an ninh lưu động tại cổng Bắc trong 20 phút tới.',
    time: '2 phút',
  },
  {
    id: 'n2',
    source: 'Ban chỉ huy VOC',
    title: 'Ưu tiên xử lý cảnh báo mật độ khán đài B',
    detail: 'Báo cáo tiến độ điều tiết đám đông mỗi 5 phút cho cấp trên.',
    time: '6 phút',
  },
  {
    id: 'n3',
    source: 'PCCC Thành phố',
    title: 'Nhắc kiểm tra tuyến thoát hiểm khu C1',
    detail: 'Xác minh hành lang thoát hiểm thông thoáng và phản hồi trạng thái ngay.',
    time: '12 phút',
  },
  {
    id: 'n4',
    source: 'Ban tổ chức trận',
    title: 'Yêu cầu cập nhật tình hình an ninh hiệp 2',
    detail: 'Gửi tóm tắt sự cố và các ca chưa xử lý về dashboard tổng hợp.',
    time: '18 phút',
  },
];

let notifyBound = false;

function navButtons(items) {
  return items.map((item) =>
    `<button type="button" class="nav-item sidebar-nav__item" data-nav="${item.id}">
      <i class="ti ${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
    </button>`,
  ).join('');
}

export function renderSideNavRail(side) {
  if (side === 'left') {
    return `<nav class="sidebar-nav sidebar-nav--left" aria-label="Điều hướng chính">
      <button type="button" class="sidebar-brand" data-nav="overview" aria-label="Về trang Tổng quan">
        <span class="sidebar-brand__logo"><i class="ti ti-ball-football" aria-hidden="true"></i></span>
        <span class="sidebar-brand__text">
          <span class="sidebar-brand__title">IOC Sân vận động</span>
          <span class="sidebar-brand__sub">Trung tâm điều hành sự kiện</span>
        </span>
      </button>
      <div class="sidebar-nav__items">${navButtons(NAV_LEFT)}</div>
    </nav>`;
  }
  return `<nav class="sidebar-nav sidebar-nav--right" aria-label="Điều hướng phụ">
    <div class="sidebar-nav__items">${navButtons(NAV_RIGHT)}</div>
    <div class="sidebar-nav__actions">
      <a href="../smartcity-ioc/index.html" class="sidebar-action sidebar-action--link" title="Quay về Trung tâm điều hành Smart City">
        <i class="ti ti-building-broadcast-tower" aria-hidden="true"></i>
        <span>Smart City</span>
      </a>
      <button
        type="button"
        class="sidebar-action"
        aria-label="Thông báo"
        aria-expanded="false"
        data-notify-toggle
      >
        <i class="ti ti-bell" aria-hidden="true"></i>
        <span>Thông báo</span>
        <span class="sidebar-action__badge">${NOTIFICATIONS.length}</span>
      </button>
    </div>
  </nav>`;
}

function renderNotificationModal() {
  const items = NOTIFICATIONS.map((n) => `
    <button type="button" class="sidebar-notify__item" data-notify-item="${n.id}">
      <div class="sidebar-notify__top">
        <span class="sidebar-notify__source">${n.source}</span>
        <span class="sidebar-notify__time">${n.time}</span>
      </div>
      <div class="sidebar-notify__title">${n.title}</div>
      <div class="sidebar-notify__detail" data-notify-detail="${n.id}" hidden>${n.detail}</div>
    </button>
  `).join('');
  return `<div class="sidebar-notify-modal" data-notify-modal hidden>
    <div class="sidebar-notify-modal__panel" role="dialog" aria-modal="true" aria-label="Thông báo an ninh">
      <button type="button" class="sidebar-notify-modal__close" data-notify-close aria-label="Đóng">
        <i class="ti ti-x"></i>
      </button>
      <div class="sidebar-notify__head">Thông báo liên quan an ninh</div>
      <div class="sidebar-notify__list">${items}</div>
    </div>
  </div>`;
}

function ensureNotificationModal() {
  if (document.querySelector('[data-notify-modal]')) return;
  document.body.insertAdjacentHTML('beforeend', renderNotificationModal());
}

function bindNotificationPanel() {
  if (notifyBound) return;
  notifyBound = true;

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-notify-toggle]');
    const item = e.target.closest('[data-notify-item]');
    const closeBtn = e.target.closest('[data-notify-close]');
    const modal = document.querySelector('[data-notify-modal]');
    if (!modal) return;

    if (toggle) {
      modal.hidden = false;
      document.querySelectorAll('[data-notify-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', btn === toggle ? 'true' : 'false');
      });
      return;
    }

    if (item) {
      const id = item.dataset.notifyItem;
      const detail = item.querySelector(`[data-notify-detail="${id}"]`);
      if (detail) detail.hidden = !detail.hidden;
      return;
    }

    if (closeBtn || e.target === modal) {
      modal.hidden = true;
      document.querySelectorAll('[data-notify-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

export function mountStadiumSideNav(activePageId = 'overview') {
  document.querySelectorAll('[data-side-nav-rail="left"]').forEach((el) => {
    el.outerHTML = renderSideNavRail('left');
  });
  document.querySelectorAll('[data-side-nav-rail="right"]').forEach((el) => {
    el.outerHTML = renderSideNavRail('right');
  });
  document.querySelectorAll(`.nav-item[data-nav="${activePageId}"]`).forEach((el) => {
    el.classList.add('active');
    el.setAttribute('aria-current', 'page');
  });
  ensureNotificationModal();
  bindNotificationPanel();
}
