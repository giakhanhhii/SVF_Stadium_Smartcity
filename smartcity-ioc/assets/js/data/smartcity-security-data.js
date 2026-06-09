export const securityData = {
  left: {
    personnel: {
      title: 'Cư dân',
      total: 12561,
      totalLabel: 'Dân số hiện tại',
      groups: [
        { label: 'Cư dân', value: 2305, pct: 70, color: '#23c8ee' },
        { label: 'Khách', value: 860, pct: 26, color: '#69c7e8' },
        { label: 'NN', value: 150, pct: 4, color: '#185FA5' },
      ],
    },
    cameras: {
      title: 'Tuyến camera',
      feeds: [
        { label: 'Cổng A', value: '96%', tone: 'hot' },
        { label: 'Lobby', value: 'OK', tone: 'mid' },
        { label: 'Podium', value: 'ON', tone: 'ok' },
      ],
    },
    modeTabs: ['Trực ban', 'Sự cố'],
    blacklist: { title: 'Blacklist', label: 'tháng', value: 26, trend: [0.18, 0.25, 0.22, 0.38, 0.46, 0.62, 0.58] },
    timeoutVisitors: {
      title: 'Quá hạn',
      bars: [
        { time: '16h', value: 4 },
        { time: '17h', value: 6 },
        { time: '18h', value: 8 },
        { time: '19h', value: 11 },
        { time: '20h', value: 13 },
        { time: 'Hiện', value: 15 },
      ],
    },
    residentsCare: {
      title: 'Nhóm cần chú ý',
      segments: [
        { label: 'Vắng', color: '#00d4ff', pct: 28 },
        { label: 'Ở lâu', color: '#8866ff', pct: 22 },
        { label: 'Trẻ em', color: '#66dd88', pct: 18 },
        { label: 'Người già', color: '#4488ff', pct: 32 },
      ],
    },
  },
  right: {
    environment: {
      title: 'Vùng rủi ro',
      tabs: ['Nội khu', 'Vành đai'],
      humidity: 74,
      metrics: [
        { label: 'AI cam', value: '96', pct: 79 },
        { label: 'Điểm nóng', value: '04', pct: 48 },
      ],
    },
    devices: {
      title: 'Thiết bị',
      tabs: ['Cam', 'Cổng', 'SOS', 'AI'],
      quantity: 78,
      status: 'Online',
      vents: ['A1', 'B2', 'C3'],
    },
    energy: {
      title: 'Nhịp sự cố',
      tabs: ['24h', '7 ngày', 'Khu'],
      stats: [
        { label: 'Camera', value: '11', trend: 'down', change: '0,1%' },
        { label: 'Ra vào', value: '210', trend: 'up', change: '0,12%' },
        { label: 'SOS', value: '73', trend: 'up', change: '0,11%' },
        { label: 'Đội', value: '9', trend: 'up', change: '0,013%' },
        { label: 'Mở', value: '5', trend: 'down', change: '0,11%' },
        { label: 'Đóng', value: '203', trend: 'up', change: '0,016%' },
      ],
      chart: [0.2, 0.35, 0.5, 0.65, 0.55, 0.75, 0.8, 0.6],
    },
  },
};
