import { hudHead, ringSvg, areaChartSvg } from './hud-charts.js';
import {
  renderDispatchPanel, renderDispatchDialog, MEDICAL_DISPATCH,
} from './emergency-dispatch.js';

const serviceActions = {
  nodeP1: {
    icon: 'ti-parking',
    tag: 'BÃI ĐỖ',
    title: 'Bãi P1',
    summary: 'Theo dõi sức chứa, luồng vào và tình trạng điều phối tại bãi P1.',
    stats: [['Sử dụng', '74%'], ['Chờ vào', '3 phút'], ['Trạng thái', 'Ổn định']],
    steps: ['Giữ luồng vào hiện tại', 'Theo dõi camera cổng P1', 'Chuẩn bị chuyển tải sang P3 nếu tăng'],
    primary: 'Theo dõi P1',
    done: 'Đã bật giám sát chi tiết bãi P1.',
  },
  nodeP2: {
    icon: 'ti-parking',
    tag: 'BÃI ĐỖ',
    title: 'Bãi P2',
    summary: 'Bãi P2 đang nhận luồng xe ổn định, cần giữ nhịp phân làn và cập nhật bảng LED khi mật độ tăng.',
    stats: [['Sử dụng', '69%'], ['Chờ vào', '5 phút'], ['Cổng mở', '2/2']],
    steps: ['Giữ 2 cổng mở', 'Theo dõi hàng chờ', 'Cập nhật LED nếu vượt 75%'],
    primary: 'Giám sát P2',
    done: 'Đã bật giám sát bãi P2 và hàng chờ vào bãi.',
  },
  nodeP3: {
    icon: 'ti-parking',
    tag: 'BÃI ĐỖ',
    title: 'Bãi P3',
    summary: 'Bãi P3 có thể nhận luồng chuyển tải khi P4 đông, ưu tiên xe ô tô và taxi.',
    stats: [['Sử dụng', '63%'], ['Dự phòng', '280 chỗ'], ['Ưu tiên', 'Ô tô']],
    steps: ['Mở thêm cổng phụ P3', 'Điều hướng taxi vào P3', 'Đồng bộ bảng LED'],
    primary: 'Chuyển luồng P3',
    done: 'Đã gửi lệnh điều phối thêm luồng về P3.',
  },
  nodeP4: {
    icon: 'ti-parking',
    tag: 'BÃI ĐỖ',
    title: 'Bãi P4',
    summary: 'Bãi P4 đang là điểm đông nhất, cần giảm tải bằng chuyển luồng sang P3 và mở làn phụ.',
    stats: [['Sử dụng', '88%'], ['Chờ vào', '8 phút'], ['Mức', 'Cao']],
    steps: ['Chặn nhận thêm xe không ưu tiên', 'Chuyển luồng sang P3', 'Bật cảnh báo trên LED'],
    primary: 'Giảm tải P4',
    done: 'Đã kích hoạt quy trình giảm tải P4.',
  },
  parkingHoldP2: {
    icon: 'ti-lock',
    tag: 'BÃI ĐỖ',
    title: 'Giữ chỗ P2',
    summary: 'Giữ một phần sức chứa P2 cho xe ưu tiên và xe đã được điều phối từ cổng chính.',
    stats: [['P2', '62%'], ['Giữ chỗ', '40'], ['Thời gian', '15 phút']],
    steps: ['Khóa 40 chỗ P2 trên hệ thống', 'Thông báo chốt vào bãi P2', 'Theo dõi tỷ lệ lấp đầy sau 5 phút'],
    primary: 'Giữ chỗ',
    done: 'Đã giữ 40 chỗ tại P2 cho luồng xe ưu tiên.',
  },
  parkingMarshalP2: {
    icon: 'ti-user-shield',
    tag: 'BÃI ĐỖ',
    title: 'Điều chốt P2',
    summary: 'Điều thêm nhân sự tới lối vào P2 để giảm thời gian chờ và tách luồng xe máy.',
    stats: [['Chốt P2', '2/3'], ['Chờ vào', '5 phút'], ['Mục tiêu', '<3 phút']],
    steps: ['Cử 1 chốt từ cổng B sang P2', 'Tách xe máy sang làn phải', 'Báo lại VOC sau 5 phút'],
    primary: 'Điều chốt',
    done: 'Đã điều thêm 1 chốt tới P2 và kích hoạt tách làn xe máy.',
  },
  parkingPriorityTransit: {
    icon: 'ti-bus',
    tag: 'BÃI ĐỖ',
    title: 'Ưu tiên taxi/bus',
    summary: 'Ưu tiên làn vào riêng cho taxi và bus để tránh dồn xe tại P2 trong khung cao điểm.',
    stats: [['Taxi', '4 phút'], ['Bus', '2 phút'], ['Làn ưu tiên', '1']],
    steps: ['Mở làn taxi/bus tại P2', 'Giữ xe cá nhân ở nhánh chờ', 'Theo dõi camera lối vào'],
    primary: 'Bật ưu tiên',
    done: 'Đã bật ưu tiên taxi/bus tại lối vào P2.',
  },
  nodeFb: {
    icon: 'ti-burger',
    tag: 'F&B',
    title: 'F&B C12',
    summary: 'Quầy F&B C12 cần theo dõi hàng chờ, tồn nước và tốc độ phục vụ trong giờ nghỉ.',
    stats: [['Hàng chờ', '6 phút'], ['Tồn nước', 'Đã bổ sung'], ['POS', 'Online']],
    steps: ['Tăng nhân sự quầy C12', 'Kiểm tra tồn kho nước', 'Theo dõi POS 10 phút'],
    primary: 'Điều phối F&B',
    done: 'Đã gửi điều phối tăng nhân sự F&B C12.',
  },
  nodeTicket: {
    icon: 'ti-ticket',
    tag: 'VÉ',
    title: 'Quầy vé',
    summary: 'Quầy vé đang xử lý vé điện tử và hỗ trợ check-in lỗi tại cổng phụ.',
    stats: [['Quét vé', '98,2%'], ['Hàng chờ', '6 phút'], ['Hỗ trợ', '2 line']],
    steps: ['Mở thêm line hỗ trợ', 'Đồng bộ ticket app', 'Chuyển lỗi về VOC vé'],
    primary: 'Mở hỗ trợ vé',
    done: 'Đã mở thêm line hỗ trợ quầy vé.',
  },
  medical0: {
    icon: 'ti-first-aid-kit',
    tag: 'Y TẾ',
    title: 'Trạm y tế',
    summary: 'Ba trạm y tế đang trực đầy đủ, sẵn sàng nhận điều phối từ VOC và đội an ninh.',
    stats: [['Trạm mở', '3/3'], ['SLA', '< 4 phút'], ['Kíp trực', '2 đội']],
    steps: ['Giữ kíp trực tại vị trí', 'Đồng bộ bộ đàm VOC-11', 'Chuẩn bị cáng khu B'],
    primary: 'Gửi kiểm tra y tế',
    done: 'Đã gửi kiểm tra sẵn sàng tới các trạm y tế.',
  },
  medical1: {
    icon: 'ti-map-pin',
    tag: 'Y TẾ',
    title: 'Điểm AED',
    summary: 'Các điểm AED đang trực tuyến, cần đảm bảo vị trí không bị che khuất khi khán đài đông.',
    stats: [['AED trực tuyến', '12/12'], ['Pin', 'Ổn'], ['Vị trí', 'Đã định vị']],
    steps: ['Ping trạng thái AED', 'Kiểm tra vị trí gần VIP', 'Gửi map cho đội y tế'],
    primary: 'Kiểm tra AED',
    done: 'Đã ping kiểm tra toàn bộ điểm AED.',
  },
  medical2: {
    icon: 'ti-users',
    tag: 'Y TẾ',
    title: 'Đội EMS',
    summary: 'Hai đội EMS đang trực chờ, ưu tiên khu FOP và khán đài đông.',
    stats: [['Đội EMS', '2 đội'], ['Ưu tiên', 'FOP/B'], ['Radio', 'Online']],
    steps: ['Giữ đội 1 tại FOP', 'Đội 2 phủ khán đài B', 'Bật route ưu tiên'],
    primary: 'Điều phối EMS',
    done: 'Đã gửi lệnh điều phối EMS theo vùng ưu tiên.',
  },
  medical3: {
    icon: 'ti-clock',
    tag: 'Y TẾ',
    title: 'Response SLA',
    summary: 'SLA phản ứng y tế đang trong ngưỡng, tiếp tục theo dõi thời gian đến hiện trường.',
    stats: [['SLA', '< 4 phút'], ['Khu vực', 'FOP & khán đài'], ['Rủi ro', 'Thấp']],
    steps: ['Theo dõi SLA realtime', 'Giữ route cứu hộ mở', 'Báo nếu vượt 4 phút'],
    primary: 'Bật theo dõi SLA',
    done: 'Đã bật theo dõi SLA y tế realtime.',
  },
  fire0: {
    icon: 'ti-flame',
    tag: 'PCCC',
    title: 'Tủ báo cháy',
    summary: 'Tủ báo cháy đang tốt, không có cảnh báo. Có thể chạy kiểm tra nhanh tín hiệu VOC.',
    stats: [['Tủ báo cháy', 'Tốt'], ['Cảnh báo', '0'], ['Kết nối', 'VOC sẵn sàng']],
    steps: ['Ping fire panel', 'Kiểm tra log 15 phút', 'Giữ line VOC-12'],
    primary: 'Kiểm tra panel',
    done: 'Đã ping kiểm tra fire panel.',
  },
  fire1: {
    icon: 'ti-map-pin',
    tag: 'PCCC',
    title: 'Hydrant / Pump',
    summary: 'Hệ thống hydrant và bơm ổn định, áp lực đủ cho kịch bản sơ tán.',
    stats: [['Thiết bị', '18/18'], ['Áp lực', 'Ổn định'], ['Bơm', 'Ready']],
    steps: ['Kiểm tra áp lực bơm', 'Xác nhận van khu C', 'Gửi trạng thái PCCC'],
    primary: 'Kiểm tra bơm',
    done: 'Đã gửi lệnh kiểm tra hydrant và bơm.',
  },
  fire2: {
    icon: 'ti-users',
    tag: 'SƠ TÁN',
    title: 'Lối thoát hiểm',
    summary: 'Toàn bộ lối thoát hiểm đang thông thoáng, cần giữ sạch tuyến khi kết thúc trận.',
    stats: [['Exit route', '24/24'], ['Trạng thái', 'Clear'], ['Ưu tiên', 'Cổng B/C']],
    steps: ['Giữ an ninh tại cổng B/C', 'Theo dõi camera hành lang', 'Chặn vật cản phát sinh'],
    primary: 'Giữ route mở',
    done: 'Đã gửi lệnh giữ route thoát hiểm mở.',
  },
  fire3: {
    icon: 'ti-clock',
    tag: 'PCCC',
    title: 'Đội drill crew',
    summary: 'Bốn tổ PCCC đang sẵn sàng, VOC có thể điều phối theo khu nếu có khói hoặc ùn tắc.',
    stats: [['Tổ trực', '4 tổ'], ['VOC', 'Ready'], ['Rủi ro', 'Thấp']],
    steps: ['Giữ tổ trực theo sector', 'Đồng bộ VOC-12', 'Sẵn sàng route sơ tán'],
    primary: 'Điều phối tổ PCCC',
    done: 'Đã gửi trạng thái sẵn sàng cho đội PCCC.',
  },
  trafficP3: {
    icon: 'ti-route',
    tag: 'GIAO THÔNG',
    title: 'Chuyển P3',
    summary: 'Chuyển bớt luồng xe từ P4 sang P3 để giảm hàng chờ quanh cổng chính.',
    stats: [['P4', '88%'], ['P3', '63%'], ['ETA', '5 phút']],
    steps: ['Cập nhật biển hướng dẫn', 'Điều phối bảo vệ cổng P3', 'Theo dõi hàng chờ P4'],
    primary: 'Kích hoạt chuyển P3',
    done: 'Đã gửi lệnh chuyển luồng sang P3.',
  },
  trafficLed: {
    icon: 'ti-device-tv',
    tag: 'GIAO THÔNG',
    title: 'Cập nhật LED',
    summary: 'Cập nhật bảng LED quanh sân để hướng xe sang bãi còn trống và làn phụ.',
    stats: [['Bảng LED', '6/6'], ['Nội dung', 'P3/P4'], ['Trạng thái', 'Sẵn sàng']],
    steps: ['Đẩy nội dung LED', 'Xác nhận hiển thị cổng Bắc', 'Theo dõi camera giao thông'],
    primary: 'Đẩy LED',
    done: 'Đã cập nhật bảng LED điều hướng quanh sân.',
  },
  trafficLane: {
    icon: 'ti-road',
    tag: 'GIAO THÔNG',
    title: 'Mở làn phụ',
    summary: 'Mở làn phụ để thoát xe sau trận, ưu tiên hướng ra trục đường chính.',
    stats: [['Làn phụ', 'Ready'], ['Nhân sự', '2 chốt'], ['Rủi ro', 'Thấp']],
    steps: ['Bố trí 2 chốt điều tiết', 'Mở rào làn phụ', 'Theo dõi tốc độ thoát xe'],
    primary: 'Mở làn phụ',
    done: 'Đã gửi lệnh mở làn phụ quanh sân.',
  },
};

function serviceActionModal() {
  return `<div class="svc-action-modal" data-service-action-modal hidden>
    <div class="svc-action-modal__panel" role="dialog" aria-modal="true" aria-label="Thông tin dịch vụ">
      <button type="button" class="event-action-modal__close" data-service-action-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="event-action-modal__head">
        <span class="event-action-modal__icon"><i class="ti ti-info-circle" data-service-action-icon></i></span>
        <div><small data-service-action-tag>DỊCH VỤ</small><h3 data-service-action-title>Thông tin dịch vụ</h3></div>
      </div>
      <p data-service-action-summary></p>
      <div class="svc-action-modal__stats" data-service-action-stats></div>
      <div class="event-action-modal__steps" data-service-action-steps></div>
      <div class="event-action-modal__status"><i class="ti ti-broadcast"></i><span data-service-action-status>Chờ xác nhận thao tác.</span></div>
      <button type="button" class="event-action-modal__primary" data-service-action-confirm>
        <i class="ti ti-send"></i><span data-service-action-primary>Kích hoạt</span>
      </button>
    </div>
  </div>`;
}

function getServiceModal(root) {
  const modal = root.querySelector('[data-service-action-modal]') || document.querySelector('[data-service-action-modal]');
  if (!modal) return null;
  const bodyModal = document.body.querySelector('[data-service-action-modal]');
  if (bodyModal && bodyModal !== modal) bodyModal.remove();
  if (modal.parentElement !== document.body) document.body.appendChild(modal);
  return modal;
}

function fillServiceModal(root, action) {
  const modal = getServiceModal(root);
  if (!modal || !action) return;
  modal.querySelector('[data-service-action-icon]').className = `ti ${action.icon}`;
  modal.querySelector('[data-service-action-tag]').textContent = action.tag;
  modal.querySelector('[data-service-action-title]').textContent = action.title;
  modal.querySelector('[data-service-action-summary]').textContent = action.summary;
  modal.querySelector('[data-service-action-primary]').textContent = action.primary;
  modal.querySelector('[data-service-action-status]').textContent = 'Chờ xác nhận thao tác.';
  modal.querySelector('[data-service-action-stats]').innerHTML = action.stats
    .map(([label, value]) => `<span><b>${value}</b><em>${label}</em></span>`)
    .join('');
  modal.querySelector('[data-service-action-steps]').innerHTML = action.steps
    .map((step, index) => `<span><b>0${index + 1}</b>${step}</span>`)
    .join('');
  modal.dataset.doneStatus = action.done;
  modal.hidden = false;
}

function serviceParkingMap(parking) {
  const highLot = parking.groups.reduce((max, lot) => (lot.value > max.value ? lot : max), parking.groups[0]);
  const avg = Math.round(parking.groups.reduce((sum, lot) => sum + lot.value, 0) / Math.max(parking.groups.length, 1));
  const lots = parking.groups.map((g, index) => {
    const x = [14, 57, 14, 57][index] || 14;
    const y = [16, 16, 54, 54][index] || 16;
    const tone = g.value >= 85 ? 'hot' : 'ok';
    return `<g class="svc-parking-map__lot svc-parking-map__lot--${tone}">
      <rect x="${x}" y="${y}" width="29" height="22" rx="3"/>
      <text x="${x + 14.5}" y="${y + 10}">${g.label}</text>
      <text x="${x + 14.5}" y="${y + 19}">${g.value}%</text>
    </g>`;
  }).join('');
  return `<div class="svc-parking-viz">
    <div class="svc-parking-viz__top">
      ${ringSvg(parking.total, 'Bãi xe')}
      <div class="svc-parking-bars">
        <div class="svc-parking-bar"><span>Bãi cao nhất</span><b>${highLot.label} ${highLot.value}%</b><em><i style="width:${highLot.value}%"></i></em></div>
        <div class="svc-parking-bar"><span>Trung bình</span><b>${avg}%</b><em><i style="width:${avg}%"></i></em></div>
      </div>
    </div>
    <svg class="svc-parking-map" viewBox="0 0 100 92" aria-hidden="true">
      <path class="svc-parking-map__road" d="M8 44h84M50 8v76"/>
      <rect class="svc-parking-map__stadium" x="38" y="35" width="24" height="22" rx="11"/>
      ${lots}
    </svg>
  </div>`;
}

function serviceNodeMap(feeds = []) {
  const icons = ['ti-parking', 'ti-parking', 'ti-parking', 'ti-parking', 'ti-burger', 'ti-ticket'];
  const actions = ['nodeP1', 'nodeP2', 'nodeP3', 'nodeP4', 'nodeFb', 'nodeTicket'];
  const nodes = feeds.map((feed, index) => {
    const angle = (-92 + index * (360 / feeds.length)) * Math.PI / 180;
    return {
      label: feed.label,
      action: actions[index],
      icon: icons[index] || 'ti-point',
      x: 50 + Math.cos(angle) * 36,
      y: 50 + Math.sin(angle) * 32,
      tone: index >= 4 ? 'commerce' : 'parking',
    };
  });
  return `<div class="svc-node-map">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="svc-node-map__hub-glow" cx="50" cy="50" r="18"/>
      <circle class="svc-node-map__hub" cx="50" cy="50" r="7"/>
      ${nodes.map((n) => `<line class="svc-node-map__line svc-node-map__line--${n.tone}" x1="50" y1="50" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join('')}
      ${nodes.map((n) => `<circle class="svc-node-map__node svc-node-map__node--${n.tone}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5.4"/>`).join('')}
    </svg>
    <div class="svc-node-map__labels">${nodes.map((n) =>
    `<button type="button" class="svc-node-label svc-node-label--${n.tone}" data-service-action="${n.action}"><i class="ti ${n.icon}"></i><b>${n.label}</b></button>`,
  ).join('')}</div>
  </div>`;
}

function serviceQueueMap(view) {
  const max = Math.max(...view.bars.map((bar) => bar.value), 1);
  const cells = view.bars.map((bar) => {
    const tone = bar.value >= max * 0.78 ? 'hot' : bar.value >= max * 0.52 ? 'warn' : 'ok';
    return `<button type="button" class="svc-queue-cell svc-queue-cell--${tone}">
      <span>${bar.time}</span>
      <i style="height:${Math.max(18, (bar.value / max) * 100)}%"></i>
      <b>${bar.value}</b>
    </button>`;
  }).join('');
  const actions = (view.actions || []).map((item) =>
    `<button type="button" class="svc-dispatch-action" data-service-action="${item.action}">
      <i class="ti ${item.icon}"></i><span>${item.label}</span>
    </button>`,
  ).join('');
  const dispatch = actions ? `<div class="svc-dispatch-map">
    <svg viewBox="0 0 180 64" aria-hidden="true">
      <path class="svc-dispatch-map__route svc-dispatch-map__route--priority" d="M18 18h58l22 14h64"/>
      <path class="svc-dispatch-map__route svc-dispatch-map__route--standby" d="M18 46h58l22-14"/>
      <circle class="svc-dispatch-map__node svc-dispatch-map__node--priority" cx="30" cy="18" r="7"/>
      <circle class="svc-dispatch-map__node svc-dispatch-map__node--active" cx="98" cy="32" r="7"/>
      <circle class="svc-dispatch-map__node svc-dispatch-map__node--standby" cx="150" cy="32" r="7"/>
      <text x="30" y="21">P2</text>
      <text x="98" y="35">Chốt</text>
      <text x="150" y="35">Taxi</text>
    </svg>
    <div class="svc-dispatch-actions">${actions}</div>
  </div>` : '';
  return `<div class="svc-mode-viz">
    <div class="svc-mode-viz__stat"><i class="ti ${view.icon}"></i><strong>${view.value}</strong><span>${view.label}</span></div>
    <div class="svc-queue-map">${cells}</div>
    ${dispatch}
  </div>`;
}

function renderServiceModeView(view) {
  return `<section class="hud-block">${hudHead(view.statTitle)}${serviceQueueMap(view)}</section>`;
}

export function renderServicesLeft(d) {
  return `
    <section class="hud-block">${hudHead(d.services.title)}${serviceNodeMap(d.services.feeds)}</section>
    <section class="hud-block">${hudHead(d.parking.title)}${serviceParkingMap(d.parking)}</section>
    <div class="hud-tabs hud-tabs--dual" data-services-mode-tabs>
      <button class="hud-tab hud-tab--active" data-services-mode="parking">${d.modeTabs[0]}</button>
      <button class="hud-tab" data-services-mode="commerce">${d.modeTabs[1]}</button>
    </div>
    <div data-services-mode-panel>${renderServiceModeView(d.modeViews.parking)}</div>`;
}

function renderVocOpsBlock(block, icon, tone = 'medical') {
  const nodeIcons = [icon, 'ti-map-pin', 'ti-users', 'ti-clock'];
  const actions = tone === 'fire'
    ? ['fire0', 'fire1', 'fire2', 'fire3']
    : ['medical0', 'medical1', 'medical2', 'medical3'];
  const stats = block.stats.map((s, index) => {
    const pct = [100, 88, 76, 64][index] || 70;
    return `<button type="button" class="svc-ops-node svc-ops-node--${tone}" data-service-action="${actions[index]}">
      <i class="ti ${nodeIcons[index] || icon}"></i>
      <b>${s.value}</b>
      <em style="width:${pct}%"></em>
    </button>`;
  }).join('');
  return `<section class="hud-block">
    ${hudHead(block.title)}
    <div class="svc-ops-diagram svc-ops-diagram--${tone}">
      <div class="svc-ops-core"><i class="ti ${icon}"></i><strong>${block.status}</strong></div>
      <div class="svc-ops-grid">${stats}</div>
    </div>
  </section>`;
}

function serviceAlertBoard(alerts = []) {
  return `<div class="svc-alert-board">${alerts.map((alert, index) => {
    const tone = index === 0 ? 'warn' : index === 1 ? 'info' : 'ok';
    const pct = [86, 62, 44][index] || 50;
    return `<div class="svc-alert-strip svc-alert-strip--${tone}">
      <i style="width:${pct}%"></i>
      <b>${alert.tag}</b>
      <span>${alert.time}</span>
    </div>`;
  }).join('')}</div>`;
}

function serviceTrafficFlow(traffic) {
  const actions = ['trafficP3', 'trafficLed', 'trafficLane'];
  const lanes = traffic.lanes.map((lane, index) =>
    `<button type="button" class="svc-lane svc-lane--info" data-service-action="${actions[index]}">${lane}</button>`,
  ).join('');
  const checks = [
    { label: 'P4', value: 'cao', tone: 'warn' },
    { label: 'P3', value: 'dự phòng', tone: 'ok' },
    { label: 'LED', value: '6/6', tone: 'ok' },
    { label: 'EMS', value: 'thoáng', tone: 'ok' },
  ].map((check) =>
    `<span class="svc-traffic-check svc-traffic-check--${check.tone}"><b>${check.label}</b><em>${check.value}</em></span>`,
  ).join('');
  return `<div class="svc-traffic-flow">
    <svg viewBox="0 0 150 62" aria-hidden="true">
      <path class="svc-traffic-flow__road" d="M8 14h116l16 10-16 10H8"/>
      <path class="svc-traffic-flow__road svc-traffic-flow__road--alt" d="M8 48h94l20-14"/>
      <circle class="svc-traffic-flow__node svc-traffic-flow__node--hot" cx="105" cy="14" r="5"/>
      <circle class="svc-traffic-flow__node" cx="72" cy="48" r="5"/>
      <circle class="svc-traffic-flow__node svc-traffic-flow__node--ok" cx="126" cy="34" r="5"/>
    </svg>
    <div class="svc-traffic-checks">${checks}</div>
    <div class="svc-lane-row">${lanes}</div>
  </div>`;
}

function serviceRevenueViz(revenue) {
  const stats = revenue.stats.map((s, index) =>
    `<span class="svc-revenue-chip svc-revenue-chip--${index % 2 ? 'blue' : 'cyan'}"><b>${s.value}</b><i>${s.change}</i></span>`,
  ).join('');
  return `<div class="svc-revenue-viz">
    <div class="svc-revenue-grid">${stats}</div>
    ${areaChartSvg(revenue.chart, 'svcGrad')}
  </div>`;
}

export function renderServicesRight(d) {
  const tabKeys = ['fb', 'parking', 'wifi'];
  const tabs = d.fb.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}" data-services-fb="${tabKeys[i]}">${t}</button>`,
  ).join('');
  const fbView = d.fb.views.fb;
  const bars = fbView.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Dịch vụ & Phản hồi')}${serviceAlertBoard(d.alerts)}</section>
    ${renderDispatchPanel({
      id: 'medical',
      title: hudHead('Gọi Y tế / Cứu hỏa'),
      buttonLabel: 'Gọi Y tế / Cứu hỏa',
      metaLines: [
        '<i class="ti ti-first-aid-kit"></i> 115 / VOC-11',
        '<i class="ti ti-flame"></i> 114 / VOC-12',
      ],
    })}
    ${renderVocOpsBlock(d.medical, 'ti-first-aid-kit', 'medical')}
    ${renderVocOpsBlock(d.fire, 'ti-flame', 'fire')}
    <section class="hud-block" data-services-fb-panel>${hudHead(d.fb.title)}<div class="hud-tabs" data-services-fb-tabs>${tabs}</div>
      <div class="hud-env-row">${ringSvg(fbView.ringPct, fbView.ringLabel)}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.traffic.title)}${serviceTrafficFlow(d.traffic)}</section>
    ${serviceActionModal()}
    ${renderDispatchDialog(MEDICAL_DISPATCH)}`;
}

function renderFbView(d, key) {
  const values = ['fb', 'parking', 'wifi'];
  const view = d.fb.views[key] || d.fb.views.fb;
  const tabs = d.fb.tabs.map((t, i) => {
    const value = values[i];
    return `<button class="hud-tab${value === key ? ' hud-tab--active' : ''}" data-services-fb="${value}" aria-pressed="${value === key}">${t}</button>`;
  }).join('');
  const bars = view.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  return `${hudHead(d.fb.title)}<div class="hud-tabs" data-services-fb-tabs>${tabs}</div>
    <div class="hud-env-row">${ringSvg(view.ringPct, view.ringLabel)}<div class="hud-env-bars">${bars}</div></div>`;
}

export function bindServicesHudTabs(root, data) {
  if (!root.dataset.servicesActionsBound) {
    root.dataset.servicesActionsBound = 'true';
    root.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-service-action]');
      if (!actionBtn || !root.contains(actionBtn)) return;
      fillServiceModal(root, serviceActions[actionBtn.dataset.serviceAction]);
    });
  }

  root.querySelector('[data-services-mode-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-services-mode]');
    if (!tab) return;
    const panel = root.querySelector('[data-services-mode-panel]');
    const view = data.left.modeViews[tab.dataset.servicesMode];
    if (panel && view) panel.innerHTML = renderServiceModeView(view);
  });

  root.querySelector('[data-services-fb-panel]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-services-fb]');
    if (!tab) return;
    const panel = root.querySelector('[data-services-fb-panel]');
    if (panel) panel.innerHTML = renderFbView(data.right, tab.dataset.servicesFb);
  });
}

document.addEventListener('click', (event) => {
  const activeModal = document.querySelector('[data-service-action-modal]:not([hidden])');
  if (!activeModal) return;
  if (event.target.closest('[data-service-action-close]') || event.target === activeModal) {
    activeModal.hidden = true;
    return;
  }
  if (event.target.closest('[data-service-action-confirm]')) {
    activeModal.querySelector('[data-service-action-status]').textContent = activeModal.dataset.doneStatus;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const activeModal = document.querySelector('[data-service-action-modal]:not([hidden])');
  if (activeModal) activeModal.hidden = true;
});
