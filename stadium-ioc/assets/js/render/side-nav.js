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
      <button type="button" class="sidebar-action" aria-label="Thông báo">
        <i class="ti ti-bell" aria-hidden="true"></i>
        <span class="sidebar-action__badge">4</span>
      </button>
      <div class="sidebar-action sidebar-action--avatar" aria-hidden="true">SV</div>
    </div>
  </nav>`;
}

export function mountStadiumSideNav() {
  document.querySelectorAll('[data-side-nav-rail="left"]').forEach((el) => {
    el.outerHTML = renderSideNavRail('left');
  });
  document.querySelectorAll('[data-side-nav-rail="right"]').forEach((el) => {
    el.outerHTML = renderSideNavRail('right');
  });
}
