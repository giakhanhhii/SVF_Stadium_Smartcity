import { parkingVehicleLots, parkingVehicleSummary } from './stadium-parking-vehicles-data.js';

const busiestParkingLot = parkingVehicleLots.reduce((max, lot) => (lot.usagePct > max.usagePct ? lot : max), parkingVehicleLots[0]);
const parkingCarPct = Math.round((parkingVehicleSummary.cars / parkingVehicleSummary.total) * 100);
const parkingMotorbikePct = 100 - parkingCarPct;

export const servicesHud = {
  left: {
    parking: {
      title: 'Bãi đỗ xe',
      total: parkingVehicleSummary.usagePct,
      totalLabel: `% sử dụng — ${parkingVehicleSummary.total} / ${parkingVehicleSummary.capacity} phương tiện`,
      groups: parkingVehicleLots.map((lot, index) => ({
        label: lot.id,
        value: lot.usagePct,
        capacity: lot.capacity,
        vehicles: lot.total,
        cars: lot.cars,
        motorbikes: lot.motorbikes,
        wait: [3, 5, 4, 8][index] || 4,
        tone: ['cyan', 'purple', 'blue', 'cyan'][index] || 'cyan',
      })),
      ops: [
        { label: 'Xe trong bãi', value: `${parkingVehicleSummary.total}/${parkingVehicleSummary.capacity}` },
        { label: 'Chờ lâu nhất', value: `P${busiestParkingLot.id.replace('P', '')} · 8 ph` },
        { label: 'Làn mở', value: '7/9' },
        { label: 'Bảng LED', value: '6/6' },
      ],
      actions: [
        { label: 'Chuyển P3', icon: 'ti-route', action: 'trafficP3' },
        { label: 'Cập nhật LED', icon: 'ti-device-tv', action: 'trafficLed' },
        { label: 'Mở làn phụ', icon: 'ti-road', action: 'trafficLane' },
      ],
    },
    services: {
      title: 'Điểm dịch vụ',
      feeds: [
        { label: 'Bãi P1' },
        { label: 'Bãi P2' },
        { label: 'Bãi P3' },
        { label: 'Bãi P4' },
        { label: 'F&B C12' },
        { label: 'Quầy vé' },
      ],
    },
    modeTabs: ['Bãi đỗ', 'F&B & Vé'],
    modeViews: {
      parking: {
        statTitle: 'Điều phối bãi đỗ',
        icon: 'ti-parking',
        label: `Bãi ${busiestParkingLot.id} đông`,
        value: `${parkingVehicleSummary.total}`,
        chartTitle: 'Thời gian chờ bãi',
        subtitle: 'phút — theo bãi',
        bars: [
          { time: 'P1', value: 3 },
          { time: 'P2', value: 5 },
          { time: 'P3', value: 4 },
          { time: 'P4', value: 8 },
          { time: 'Taxi', value: 4 },
          { time: 'Bus', value: 2 },
        ],
        actions: [
          { label: 'Giữ chỗ P2', icon: 'ti-lock', action: 'parkingHoldP2' },
          { label: 'Điều chốt P2', icon: 'ti-user-shield', action: 'parkingMarshalP2' },
          { label: 'Ưu tiên taxi/bus', icon: 'ti-bus', action: 'parkingPriorityTransit' },
        ],
      },
      commerce: {
        statTitle: 'F&B & Vé điện tử',
        icon: 'ti-ticket',
        label: 'Quét vé thành công',
        value: '98,2%',
        chartTitle: 'Hàng chờ dịch vụ',
        subtitle: 'phút — theo điểm',
        bars: [
          { time: 'F&B', value: 4 },
          { time: 'C12', value: 6 },
          { time: 'Cổng', value: 3 },
          { time: 'Vé', value: 6 },
          { time: 'VIP', value: 2 },
          { time: 'App', value: 1 },
        ],
      },
    },
  },
  right: {
    fb: {
      title: 'F&B & Tiện ích',
      tabs: ['F&B', 'Bãi đỗ', 'WiFi'],
      views: {
        fb: {
          ringPct: parkingVehicleSummary.usagePct,
          ringLabel: 'Doanh thu',
          metrics: [
            { label: 'Quầy mở', value: '24/24', pct: 100 },
            { label: 'Hàng chờ TB', value: '4 ph', pct: 35 },
          ],
        },
        parking: {
          ringPct: 78,
          ringLabel: 'Bãi đỗ',
          metrics: [
            { label: 'Ô tô', value: `${parkingVehicleSummary.cars}`, pct: parkingCarPct },
            { label: 'Xe máy', value: `${parkingVehicleSummary.motorbikes}`, pct: parkingMotorbikePct },
            { label: 'Tổng', value: `${parkingVehicleSummary.total}`, pct: parkingVehicleSummary.usagePct },
          ],
        },
        wifi: {
          ringPct: 96,
          ringLabel: 'WiFi ổn',
          metrics: [
            { label: 'Thiết bị trực tuyến', value: '12.4K', pct: 86 },
            { label: 'Băng thông', value: 'Ổn định', pct: 96 },
          ],
        },
      },
    },
    traffic: {
      title: 'Lưu thông quanh sân',
      tabs: ['Trực tiếp', 'Dự báo', 'Sau trận'],
      quantity: 4,
      status: `${parkingVehicleSummary.cars} ô tô · ${parkingVehicleSummary.motorbikes} xe máy`,
      lanes: ['Chuyển P3', 'Cập nhật LED', 'Mở làn phụ'],
    },
    medical: {
      title: 'Y tế sân vận động',
      status: 'Y tế FIFA: SẴN SÀNG',
      stats: [
        { label: 'Trạm y tế', value: '3/3', trend: 'up', change: 'Mở trực' },
        { label: 'AED points', value: '12/12', trend: 'up', change: 'Online' },
        { label: 'Đội EMS', value: '2 đội', trend: 'up', change: 'Trực chờ' },
        { label: 'Response SLA', value: '< 4 ph', trend: 'up', change: 'FOP & khán đài' },
      ],
    },
    fire: {
      title: 'Phòng cháy chữa cháy',
      status: 'PCCC: TỐT',
      stats: [
        { label: 'Tủ báo cháy', value: 'Tốt', trend: 'up', change: '0 cảnh báo' },
        { label: 'Hydrant / Pump', value: '18/18', trend: 'up', change: 'Áp ổn định' },
        { label: 'Lối thoát', value: '24/24', trend: 'up', change: 'Thông thoáng' },
        { label: 'Tổ diễn tập', value: '4 tổ', trend: 'up', change: 'VOC sẵn sàng' },
      ],
    },
    revenue: {
      title: 'Dịch vụ khán giả 24h',
      tabs: ['Doanh thu', 'Phản hồi', 'WiFi'],
      stats: [
        { label: 'Bãi đỗ sử dụng', value: `${parkingVehicleSummary.usagePct}%`, trend: 'up', change: `${parkingVehicleSummary.total} xe` },
        { label: 'F&B doanh thu', value: '842M', trend: 'up', change: '+18%' },
        { label: 'WiFi thiết bị', value: '12.4K', trend: 'up', change: 'Ổn định' },
        { label: 'Phản hồi app', value: '23', trend: 'down', change: '3 mới' },
      ],
      chart: [0.12, 0.18, 0.35, 0.55, 0.72, 0.85, 0.92, 0.88, 0.75, 0.55, 0.35, 0.2],
    },
    alerts: [
      { tag: 'CẢNH BÁO', tagBg: '#3d3010', tagColor: '#BA7517', title: `Bãi ${busiestParkingLot.id} đông — ${busiestParkingLot.usagePct}%`, time: '5 phút' },
      { tag: 'PHẢN HỒI', tagBg: '#0a2840', tagColor: '#00d4ff', title: 'Cổng B3 — Hàng chờ dài', time: '18 phút' },
      { tag: 'XỬ LÝ', tagBg: '#0a3028', tagColor: '#1D9E75', title: 'F&B C12 hết nước — Đã bổ sung', time: '35 phút' },
    ],
  },
};
