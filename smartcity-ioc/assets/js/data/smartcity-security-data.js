export const securityData = {
  left: {
    personnel: {
      title: 'Thống kê nhân sự',
      total: 12561,
      totalLabel: 'Dân số hiện tại',
      groups: [
        { label: 'Cư dân', value: 2305, tone: 'cyan' },
        { label: 'Khách', value: 860, tone: 'purple' },
        { label: 'Người nước ngoài', value: 150, tone: 'blue' },
      ],
    },
    cameras: {
      title: 'Camera giám sát',
      feeds: [
        { label: 'Lối vào Đông Nam' },
        { label: 'Lối vào chính' },
        { label: 'Lối vào Tây' },
        { label: 'Podium' },
        { label: 'Lối vào Nam' },
        { label: 'Sân sau' },
      ],
    },
    modeTabs: ['Thống kê quản lý', 'Quản lý sự cố'],
    blacklist: { title: 'Dữ liệu blacklist', label: 'Xuất hiện tháng này', value: 26 },
    timeoutVisitors: {
      title: 'Khách quá hạn',
      subtitle: 'Phân bố khách quá hạn theo ngày',
      bars: [
        { time: '14:27', value: 8 },
        { time: '14:26', value: 5 },
        { time: '14:25', value: 9 },
        { time: '14:24', value: 4 },
        { time: '14:23', value: 7 },
        { time: '14:22', value: 3 },
      ],
    },
    residentsCare: {
      title: 'Chăm sóc cư dân',
      segments: [
        { label: 'Vắng lâu', color: '#00d4ff', pct: 28 },
        { label: 'Ở trong lâu', color: '#8866ff', pct: 22 },
        { label: 'Trẻ em một mình', color: '#66dd88', pct: 18 },
        { label: 'Người già một mình', color: '#4488ff', pct: 32 },
      ],
    },
  },
  right: {
    environment: {
      title: 'Tổng quan môi trường',
      tabs: ['Nội thất', 'Ngoài trời'],
      humidity: 74,
      metrics: [
        { label: 'PM2.5 nội thất', value: '158', pct: 79 },
        { label: 'Nhiệt độ nội thất', value: '24°C', pct: 48 },
      ],
    },
    devices: {
      title: 'Vận hành thiết bị',
      tabs: ['Điều hòa', 'Cấp nước', 'Camera', 'Cảm biến'],
      quantity: 78,
      status: 'Hoạt động',
      vents: ['Vent Set 1', 'Vent Set 2', 'Vent Set 3'],
    },
    energy: {
      title: 'Thống kê năng lượng',
      tabs: ['Tiêu thụ', 'Tải', 'Chi phí'],
      stats: [
        { label: 'Tiêu thụ ngày (kWh)', value: '11.646', trend: 'down', change: '0,1%' },
        { label: 'Tiêu thụ năm (kWh)', value: '210.477', trend: 'up', change: '0,12%' },
        { label: 'Tải ngày (kWh)', value: '73.658', trend: 'up', change: '0,11%' },
        { label: 'TB năm (kWh)', value: '9.878', trend: 'up', change: '0,013%' },
        { label: 'Chi phí ngày (VNĐ)', value: '5.561', trend: 'down', change: '0,11%' },
        { label: 'Chi phí năm (VNĐ)', value: '203.144', trend: 'up', change: '0,016%' },
      ],
      chart: [0.2, 0.35, 0.5, 0.65, 0.55, 0.75, 0.8, 0.6],
    },
  },
};
