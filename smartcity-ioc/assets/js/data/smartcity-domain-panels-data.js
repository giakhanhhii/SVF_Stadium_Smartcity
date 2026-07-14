// Mock data cho 3 trang domain (environment / utilities / reports) — tách từ
// render/smartcity-domain-command-panels.js. Panel nhận data qua tham số khi hydrate;
// các bảng dưới đây (hotspot, SLA, modal...) dùng chung giữa panel và modal tương tác.

export const infrastructureHotspotItems = [
  { key: 'power', label: 'Điện', value: '1', icon: 'ti-bolt', title: 'Trạm điện B2 quá tải', status: 'Giảm tải nhánh B2 trong 15 phút.', action: 'Điều phối kỹ thuật điện', location: 'Trạm B2 · Tủ MSB-02', owner: 'Đội điện ca A', deadline: '15 phút', metrics: [['Tải', '94%'], ['Dự phòng', '2N'], ['UPS', '38m']], steps: ['Giảm tải nhánh B2', 'Kiểm tra nhiệt tủ MSB', 'Xác nhận tải về dưới 80%'] },
  { key: 'water', label: 'Nước', value: '2', icon: 'ti-droplet', title: 'Áp suất nước thấp', status: 'Hai cụm bơm cần kiểm tra áp lực.', action: 'Mở lệnh kiểm tra bơm', location: 'Cụm bơm P07/P11', owner: 'Đội nước', deadline: '32 phút', metrics: [['Áp suất', '2.1 bar'], ['Bơm online', '23/24'], ['Van', '92%']], steps: ['Kiểm tra bơm P07', 'Mở tuyến cấp bù', 'Đối chiếu áp suất tầng cao'] },
  { key: 'lift', label: 'Thang', value: '1', icon: 'ti-elevator', title: 'Cabin thang báo lỗi', status: 'Tòa S2, thang số 03 cần khóa tạm.', action: 'Gửi đội bảo trì thang', location: 'S2 · Thang 03', owner: 'Bảo trì thang máy', deadline: '18 phút', metrics: [['Lỗi', 'E42'], ['Cabin', 'Tầng 12'], ['SLA', '86%']], steps: ['Khóa gọi tầng', 'Thông báo cư dân S2', 'Reset bộ điều khiển cabin'] },
  { key: 'site', label: 'Công trường', value: '3', icon: 'ti-barrier-block', title: 'Bụi và tiếng ồn tăng', status: 'Ba điểm thi công vượt dải giám sát.', action: 'Nhắc nhà thầu xử lý', location: 'Cổng C · Khu thi công', owner: 'Ban an toàn công trường', deadline: '20 phút', metrics: [['Bụi', '72%'], ['Ồn', '68 dB'], ['Điểm', '3']], steps: ['Tưới giảm bụi', 'Giảm khung giờ ồn', 'Ghi nhận ảnh hiện trường'] },
  { key: 'camera', label: 'Camera', value: '3', icon: 'ti-device-cctv', title: 'Camera offline', status: 'Ba camera vành đai mất tín hiệu.', action: 'Kiểm tra tuyến mạng', location: 'Vành đai B/C', owner: 'Đội mạng camera', deadline: '26 phút', metrics: [['Offline', '3'], ['Online', '72'], ['NVR', 'OK']], steps: ['Ping camera offline', 'Kiểm tra switch PoE', 'Ghim camera thay thế'] },
  { key: 'light', label: 'Đèn', value: '5', icon: 'ti-bulb', title: 'Chiếu sáng cần kiểm tra', status: 'Năm đèn LED chưa phản hồi điều khiển.', action: 'Tạo phiếu bảo trì đèn', location: 'Trục đường D2', owner: 'Đội chiếu sáng', deadline: '1 giờ', metrics: [['Đèn lỗi', '5'], ['Lux TB', '78%'], ['Tủ', 'D2-04']], steps: ['Kiểm tra tủ D2-04', 'Bật kịch bản bù sáng', 'Tạo phiếu thay driver LED'] },
];

export const infrastructureSlaItems = [
  { label: 'Dien', display: 'Điện', value: 96, visual: 96, status: 'Ổn định', need: 'Giữ 1 kỹ thuật trực', move: 'Không cần đổi ca' },
  { label: 'Nuoc', display: 'Nước', value: 91, visual: 76, status: 'Theo dõi', need: 'Bổ sung kiểm tra bơm', move: 'Chuyển 1 người từ Điện sang Nước' },
  { label: 'Thang', display: 'Thang', value: 86, visual: 56, status: 'Nguy cơ trễ', need: 'Cần xử lý lỗi cabin nhanh', move: 'Gán đội bảo trì thang ưu tiên 18 phút' },
  { label: 'Den', display: 'Đèn', value: 94, visual: 88, status: 'Ổn định', need: 'Giữ lịch bảo trì', move: 'Không cần đổi ca' },
  { label: 'Cam', display: 'Cam', value: 88, visual: 64, status: 'Cần kéo lên', need: 'Thiếu người kiểm tra switch PoE', move: 'Chuyển 1 kỹ thuật mạng sang Camera' },
  { label: 'CT', display: 'CT', value: 82, visual: 40, status: 'Thấp nhất', need: 'Cần nhắc nhà thầu tại hiện trường', move: 'Gán giám sát hiện trường hỗ trợ Công trường' },
];

export const constructionSites = [
  { id: 'S5A', name: 'Tòa S5A', progress: 88, status: 'Hoàn thiện', risk: 'Bụi thấp', crew: '86 công nhân', eta: 'Q3/2026' },
  { id: 'S6B', name: 'Tòa S6B', progress: 64, status: 'Kết cấu', risk: 'Cần che chắn', crew: '124 công nhân', eta: 'Q4/2026' },
  { id: 'S7C', name: 'Tòa S7C', progress: 76, status: 'MEP', risk: 'Ổn định', crew: '72 công nhân', eta: 'Q4/2026' },
  { id: 'S8D', name: 'Tòa S8D', progress: 96, status: 'Nghiệm thu', risk: 'Sẵn sàng bàn giao', crew: '34 công nhân', eta: '06/2026' },
];

export const infrastructureAlertAxes = [
  { label: 'Nước', value: 88 },
  { label: 'Bụi', value: 76 },
  { label: 'EXIT', value: 92 },
  { label: 'Điện', value: 58 },
  { label: 'Thang', value: 63 },
  { label: 'Cam', value: 46 },
];

export const infrastructureAlertItems = [
  { id: 'drain', tag: 'Thoát nước', title: 'B2 có nguy cơ đọng nước sau mưa', level: 'Cao', owner: 'Đội nước', eta: '12 phút', action: 'Mở tuyến bơm phụ và kiểm tra van B2-03.' },
  { id: 'dust', tag: 'Công trình', title: 'Bụi S6B vượt ngưỡng cư dân', level: 'Vừa', owner: 'Giám sát xây dựng', eta: '18 phút', action: 'Yêu cầu tưới giảm bụi và bổ sung lưới chắn.' },
  { id: 'exit', tag: 'Lối EXIT', title: 'EXIT D bị thu hẹp do vật tư', level: 'Cao', owner: 'An toàn hiện trường', eta: '8 phút', action: 'Dọn vật tư khỏi hành lang và mở lại lối thoát.' },
];

export const infraOpsBuildings = [
  ['S1.01', 'An toàn', '2 HS', 'Thấp'],
  ['S1.02', 'Cảnh báo', '6 HS', 'Cao'],
  ['S2.03', 'An toàn', '0 HS', 'Thấp'],
  ['S3.01', 'Kiểm tra', '4 HS', 'Vừa'],
];

export const infraOpsTabs = [
  ['overview', 'Tất cả'],
  ['pccc', 'Phòng cháy chữa cháy'],
  ['residency', 'Cư trú'],
  ['tasks', 'Cần xử lý'],
];

export const pcccRiskBuildings = [
  { id: 'S1.02', area: 'Tầng 12 · Hành lang', sensor: 'Khói', level: 82, smoke: 64, status: 'Cảnh báo mức cao' },
  { id: 'S2.01', area: 'Tầng B1 · Phòng kỹ thuật', sensor: 'Nhiệt', level: 76, smoke: 48, status: 'Bình chữa cháy hết hạn' },
];

export const pcccFireHistory = [
  {
    id: 'F-2026-0611-03',
    time: '11/06 · 09:42',
    location: 'S1.02 · Tầng 12 · Hành lang',
    source: 'Cảm biến khói + camera AI',
    level: 'Cao',
    cause: 'Khói từ khu kỹ thuật điều hòa',
    response: 'Đã hút khói, khóa thang S1-03, đội PCCC xác minh tại chỗ',
    status: 'Đã đóng',
    duration: '18 phút',
  },
  {
    id: 'F-2026-0610-01',
    time: '10/06 · 21:18',
    location: 'S2.01 · Tầng B1 · Phòng kỹ thuật',
    source: 'Nhiệt tăng + cảnh báo tủ điện',
    level: 'Trung bình',
    cause: 'Tủ điện phụ tải nóng bất thường',
    response: 'Cắt tải nhánh phụ, kiểm tra bằng camera nhiệt',
    status: 'Theo dõi',
    duration: '26 phút',
  },
  {
    id: 'F-2026-0608-02',
    time: '08/06 · 14:05',
    location: 'TMDV · Khu bếp nhà hàng',
    source: 'Nút báo cháy thủ công',
    level: 'Thấp',
    cause: 'Khói bếp cục bộ',
    response: 'Xác minh false alarm, reset đầu báo, nhắc đơn vị vận hành',
    status: 'Đã đóng',
    duration: '9 phút',
  },
];

export const pcccPowerZones = ['IOC', 'Khu căn hộ A', 'Khu căn hộ B', 'TMDV', 'Hầm xe', 'Công viên', 'Trạm bơm', 'Cổng B2'];

export const vinServiceModalData = {
  usage: {
    tag: 'Lượt sử dụng 6 tháng',
    icon: 'ti-chart-line',
    title: 'Chi tiết lượt sử dụng dịch vụ Vin',
    summary: 'Tổng hợp mức sử dụng các dịch vụ cư dân trong 6 tháng gần nhất, gồm WaterPark, VinBus nội khu, Grand World, Vinmec và thao tác qua app cư dân.',
    stats: [['Đỉnh sử dụng', 'T5 · 88%'], ['Lượt dịch vụ', '64k'], ['Phản ánh', '146']],
    steps: ['So sánh nhu cầu theo tháng để phát hiện mùa cao điểm', 'Tách nhóm dịch vụ đông: WaterPark, VinBus, Grand World', 'Mở điều phối khi tỷ lệ sử dụng vượt 84% hoặc phản ánh tăng'],
  },
  fee: {
    tag: 'Phí dịch vụ',
    icon: 'ti-home-dollar',
    title: 'Phí dịch vụ cư dân',
    summary: 'Theo dõi phí 900k/tháng/nhà, trạng thái đóng phí và quyền dùng các dịch vụ Vin trong tháng.',
    stats: [['Mức phí', '900k/nhà'], ['Hộ đã đóng', '18.420'], ['Nhắc phí', '312 căn']],
    steps: ['Đối soát căn hộ chưa đóng', 'Gửi nhắc phí qua app cư dân', 'Đồng bộ quyền dịch vụ trong ngày'],
  },
  waterpark: {
    tag: 'VinWonders WaterPark',
    icon: 'ti-swimming',
    title: 'VinWonders WaterPark',
    summary: 'Quản lý lượt cư dân và khách ngoài cư dân sử dụng WaterPark theo tháng, kèm vi phạm khung giờ.',
    stats: [['Cư dân', '38k'], ['Không cư dân', '26k'], ['Vi phạm', '54 lượt']],
    steps: ['Kiểm tra QR cư dân', 'Theo dõi lượt vượt khung giờ', 'Cân lịch ưu đãi cuối tuần'],
  },
  safari: {
    tag: 'VinWonders Safari',
    icon: 'ti-paw',
    title: 'VinWonders Safari',
    summary: 'Theo dõi quyền ưu đãi Safari cho cư dân và khách ngoài khu, tập trung đối soát lượt dùng sai nhóm.',
    stats: [['Cư dân', '15k'], ['Không cư dân', '6k'], ['Vi phạm', '18 lượt']],
    steps: ['Đối soát voucher cư dân', 'Ghim lượt dùng sai nhóm', 'Gửi báo cáo cho vận hành VinWonders'],
  },
  grandworld: {
    tag: 'Grand World',
    icon: 'ti-building-carousel',
    title: 'Grand World',
    summary: 'Giám sát lượng sử dụng tiện ích vui chơi, mua sắm và sự kiện Grand World từ nhóm cư dân Vin.',
    stats: [['Cư dân', '31k'], ['Không cư dân', '15k'], ['Vi phạm', '31 lượt']],
    steps: ['Theo dõi lượt vào theo khung giờ', 'Phân nhóm cư dân/khách', 'Cập nhật điểm nóng sự kiện'],
  },
  vinbus: {
    tag: 'VinBus',
    icon: 'ti-bus',
    title: 'VinBus nội khu',
    summary: 'Theo dõi lượt sử dụng VinBus, mật độ tuyến nội khu và nhu cầu tăng chuyến trong giờ cao điểm.',
    stats: [['Lượt tháng', '128k'], ['Tuyến chính', '6'], ['Vi phạm', '26 lượt']],
    steps: ['Tăng chuyến cuối tuần', 'Theo dõi điểm dừng đông', 'Đồng bộ cảnh báo lên app cư dân'],
  },
  vinmec: {
    tag: 'Vinmec',
    icon: 'ti-first-aid-kit',
    title: 'Vinmec cư dân',
    summary: 'Theo dõi lượt đặt lịch, khám ưu tiên và hỗ trợ y tế cho cư dân qua hệ sinh thái Vinmec.',
    stats: [['Lượt tháng', '7.8k'], ['Ưu tiên cư dân', '92%'], ['Vi phạm', '5 lượt']],
    steps: ['Xác thực quyền ưu tiên', 'Theo dõi khung giờ quá tải', 'Đẩy nhắc lịch qua app cư dân'],
  },
};

export const smartReportCases = [
  {
    id: 'SC-016-2026',
    time: '17:44',
    title: 'Auto PCCC đã kích hoạt',
    summary: 'Dashboard đã cắt điện tầng nguy cơ, hút khói và gửi đội PCCC kiểm tra tủ điện C4.',
    owner: 'Phụ trách PCCC',
    status: 'Chưa giải quyết',
    phase: 'open',
    tone: 'danger',
    attempts: 1,
    action: 'Khóa tải & điều đội PCCC',
    route: ['Auto PCCC', 'Tủ điện C4', 'Đội PCCC'],
    metrics: [['Rủi ro', 'Cao'], ['ETA', '4 ph'], ['Ảnh hưởng', '2 tòa']],
    steps: ['Cắt điện tầng nguy cơ', 'Bật hút khói và mở lối thoát hiểm', 'Giao đội PCCC xác nhận hiện trường'],
  },
  {
    id: 'SC-015-2026',
    time: '17:28',
    title: 'Mở tuyến xử lý hạ tầng',
    summary: 'Người vận hành mở tuyến xử lý cho cảm biến áp suất bất thường tại trạm bơm nước.',
    owner: 'Đội hạ tầng',
    status: 'Đang giải quyết',
    phase: 'processing',
    tone: 'warn',
    attempts: 2,
    action: 'Gửi đội hiện trường',
    route: ['IOC', 'Trạm bơm', 'Kỹ thuật'],
    metrics: [['Áp suất', 'Cao'], ['SLA', '12 ph'], ['Đội', '2 người']],
    steps: ['Khóa van theo cảnh báo BMS', 'Gửi đội hiện trường đến trạm bơm', 'Cập nhật SLA sau khi ổn định'],
  },
  {
    id: 'SC-014-2026',
    time: '16:55',
    title: 'Đảo luồng giao thông A4',
    summary: 'Dashboard giao thông đã kích hoạt kịch bản đảo luồng và điều chỉnh chu kỳ đèn khu A4/B2.',
    owner: 'Trực giao thông',
    status: 'Đang giải quyết',
    phase: 'processing',
    tone: 'warn',
    attempts: 1,
    action: 'Kích hoạt phương án đèn',
    route: ['Camera AI', 'Nút A4', 'Đèn B2'],
    metrics: [['Tải', '78%'], ['Chu kỳ', '12p'], ['Camera', '128']],
    steps: ['Gửi lệnh ưu tiên đèn xanh', 'Bật PA hướng dẫn luồng xe', 'Theo dõi camera AI trong 15 phút'],
  },
  {
    id: 'SC-013-2026',
    time: '15:40',
    title: 'Dịch vụ VinBus vượt ngưỡng',
    summary: 'Người vận hành mở chi tiết lượt dùng và điều phối VinBus do lượt sử dụng đạt 128k.',
    owner: 'Điều phối dịch vụ',
    status: 'Chưa giải quyết',
    phase: 'open',
    tone: 'danger',
    attempts: 1,
    action: 'Mở điều phối VinBus',
    route: ['Dịch vụ Vin', 'VinBus', 'App cư dân'],
    metrics: [['Lượt dùng', '128k'], ['QR', '99.2%'], ['Phản ánh', '146']],
    steps: ['Tách nhóm tuyến quá tải', 'Gửi điều phối xe tăng cường', 'Cập nhật thông báo qua app cư dân'],
  },
  {
    id: 'SC-012-2026',
    time: '14:10',
    title: 'Checklist báo cáo điều hành đã đóng',
    summary: 'Bảng báo cáo đã tổng hợp KPI hạ tầng, SLA và luồng gửi cấp trên trong ca vận hành.',
    owner: 'Trung tam IOC',
    status: 'Đã giải quyết',
    phase: 'resolved',
    tone: 'ok',
    attempts: 1,
    action: 'Xem biên bản',
    route: ['KPI', 'Checklist', 'Gửi QLĐT'],
    metrics: [['SLA', '94%'], ['Case', '42'], ['Gửi', '20:30']],
    steps: ['Đối chiếu KPI vận hành', 'Khép vòng case cần theo dõi', 'Lưu báo cáo vào dashboard'],
  },
  {
    id: 'SC-011-2026',
    time: '13:35',
    title: 'Camera AI an ninh đã xử lý cảnh báo',
    summary: 'Cảnh báo từ camera AI được gắn đội phản ứng và điểm nóng đã xác nhận an toàn.',
    owner: 'Trực an ninh',
    status: 'Đã giải quyết',
    phase: 'resolved',
    tone: 'ok',
    attempts: 1,
    action: 'Mở lại camera',
    route: ['Camera AI', 'Đội #03', 'IOC'],
    metrics: [['Camera', '96/96'], ['ETA', '6 ph'], ['SLA', 'Đúng']],
    steps: ['Xác minh lại vùng cảnh báo', 'Gắn đội phản ứng', 'Đóng cảnh báo sau khi an toàn'],
  },
];

export const trafficViolationDetails = {
  year: [
    ['2026', '3.842 lỗi', 'Vượt tốc độ, dừng đỗ sai quy định', 'Tăng 6% so với 2025'],
    ['2025', '3.624 lỗi', 'Vượt đèn đỏ, đi sai làn', 'Đã xử lý 94%'],
    ['2024', '3.180 lỗi', 'Không nhường người đi bộ', 'Đã xử lý 91%'],
  ],
  month: [
    ['Tháng 03', '88%', 'Cổng S5A', '146 lỗi vượt tốc độ'],
    ['Tháng 04', '64%', 'Vành đai S6B', '92 lỗi dừng đỗ sai'],
    ['Tháng 05', '76%', 'Nút giao S7C', '118 lỗi vượt đèn đỏ'],
    ['Tháng 06', '96%', 'Trục S8D', '174 lỗi đi sai làn'],
  ],
  week: [
    ['Tuần 23', '42 lỗi', 'Camera AI xác nhận 38 hồ sơ', 'SLA 91%'],
    ['Tuần 24', '56 lỗi', 'Tập trung khung 17:00-19:00', 'SLA 94%'],
    ['Tuần 25', '48 lỗi', '12 lỗi vượt đèn đỏ', 'SLA 89%'],
    ['Tuần 26', '63 lỗi', 'Điểm nóng S8D', 'SLA 96%'],
  ],
  day: [
    ['07:35', 'S5A', 'Vượt tốc độ', 'Đã gửi cảnh báo'],
    ['09:12', 'S6B', 'Dừng đỗ sai quy định', 'Chờ xác minh'],
    ['17:44', 'S7C', 'Vượt đèn đỏ', 'Đã tạo hồ sơ'],
    ['18:20', 'S8D', 'Đi sai làn', 'Đang điều phối'],
  ],
};

export const reportIncidentDetails = {
  all: [
    ['Giao thông', '42 vụ', 'Vượt tốc độ, vượt đèn đỏ, dừng đỗ sai', '14 vụ ưu tiên'],
    ['An ninh', '18 vụ', 'Camera AI, tụ tập bất thường, xâm nhập khu hạn chế', '5 vụ ưu tiên'],
    ['Hạ tầng', '23 vụ', 'Thang máy, cảm biến, chiếu sáng, áp lực nước', '6 vụ ưu tiên'],
    ['Dịch vụ', '31 vụ', 'Phản ánh cư dân, VinBus, tiện ích công cộng', '8 vụ ưu tiên'],
  ],
  traffic: [
    ['Vượt tốc độ', '16 vụ', 'Cổng S5A, trục S8D', 'Đã tạo 12 hồ sơ'],
    ['Vượt đèn đỏ', '11 vụ', 'Nút giao S7C', 'Camera AI xác minh'],
    ['Dừng đỗ sai', '9 vụ', 'Vành đai S6B', 'Đang nhắc xử lý'],
    ['Ùn tắc cục bộ', '6 vụ', 'Khung 17:00-19:00', 'Đã điều tiết luồng'],
  ],
  security: [
    ['Camera AI', '7 vụ', 'Phát hiện tụ tập bất thường', 'Đã xác minh 5 vụ'],
    ['Xâm nhập hạn chế', '4 vụ', 'Khu kỹ thuật và tầng hầm', 'Cần phản ứng nhanh'],
    ['Sự cố cư dân', '5 vụ', 'Yêu cầu hỗ trợ an ninh', 'Đã điều đội tuần tra'],
    ['Camera offline', '2 vụ', 'Mất tín hiệu dưới 10 phút', 'Đội mạng đang xử lý'],
  ],
  infrastructure: [
    ['Thang máy', '6 vụ', 'Lỗi cabin và kẹt tầng', 'Ưu tiên tòa S2'],
    ['Cảm biến', '5 vụ', 'Mất tín hiệu môi trường', 'Đã reset 3 điểm'],
    ['Chiếu sáng', '7 vụ', 'Đèn đường không phản hồi', 'Tạo phiếu bảo trì'],
    ['Nước/điện', '5 vụ', 'Áp lực thấp, nhánh tải cao', 'Đang theo dõi'],
  ],
  service: [
    ['Phản ánh cư dân', '12 vụ', 'Ứng dụng và hotline', 'SLA 91%'],
    ['VinBus', '7 vụ', 'Chậm chuyến, quá tải trạm', 'Đã bổ sung lượt'],
    ['Tiện ích công cộng', '6 vụ', 'Khu sinh hoạt, cảnh quan', 'Đã phân công'],
    ['Phí dịch vụ', '6 vụ', 'Đối soát và nhắc thanh toán', 'Đang xử lý'],
  ],
};

export const domainPanelsData = {
  environment: {
    pipeInfra: {
      stabilityValue: '96.4%',
      stabilityLabel: 'Độ ổn định đường ống',
      trend: '+1.8%',
      kpis: [
        { label: 'Áp suất', value: '4.2 bar', icon: 'ti-gauge' },
        { label: 'Lưu lượng', value: '92%', icon: 'ti-ripple' },
        { label: 'Điểm rò rỉ', value: '2', icon: 'ti-alert-triangle' },
      ],
    },
    hotspots: {
      slices: [
        { label: 'Mới', value: 43, color: '#00d4ff' },
        { label: 'Đang xử lý', value: 36, color: '#168fff' },
        { label: 'Theo dõi', value: 21, color: '#74c7ff' },
      ],
      items: infrastructureHotspotItems,
    },
    opsCard: {
      metrics: [
        { label: 'Tòa nhà', value: '24', tone: 'ok' },
        { label: 'Phòng cháy chữa cháy', value: '3', tone: 'danger', tab: 'pccc' },
        { label: 'Cư trú', value: '42', tone: 'info', tab: 'residency' },
        { label: 'Cần xử lý', value: '12', tone: 'warn', tab: 'tasks' },
      ],
    },
    healthSnapshot: {
      total: '12',
      gaugePct: 92,
      metrics: [
        { label: 'Khẩn cấp', value: '3', pct: 25 },
        { label: 'Quá hạn', value: '4', pct: 33 },
        { label: 'Đang xử lý', value: '5', pct: 42 },
      ],
    },
    slaMatrix: { items: infrastructureSlaItems },
    fireRiskNetwork: {
      nodes: [
        { label: 'S1', value: '82', tone: 'hot' },
        { label: 'S2', value: '76', tone: 'hot' },
        { label: 'B1', value: '54', tone: 'watch' },
        { label: 'TMDV', value: '48', tone: 'watch' },
        { label: 'Hầm', value: '43', tone: 'watch' },
        { label: 'Kho', value: '38', tone: 'idle' },
      ],
    },
    pcccCard: {
      bars: [
        { label: 'Nhiệt', value: 82 },
        { label: 'Khói', value: 64 },
        { label: 'Gas', value: 38 },
        { label: 'Điện', value: 52 },
      ],
      status: '2 tòa nhà có nguy cơ cháy nổ',
    },
    construction: { sites: constructionSites },
    alertRadar: { axes: infrastructureAlertAxes, items: infrastructureAlertItems },
  },
  utilities: {
    residentHero: {
      points: [
        { label: 'S5A', value: 88, x: 16, y: 24 },
        { label: 'S6B', value: 64, x: 62, y: 38 },
        { label: 'S7C', value: 76, x: 104, y: 32 },
        { label: 'S8D', value: 96, x: 136, y: 18 },
      ],
    },
    nodeMap: {
      nodes: [
        { id: 'fee', label: 'Phí dịch vụ', value: '900k', icon: 'ti-home-dollar', tone: 'power' },
        { id: 'waterpark', label: 'Waterpark', value: '64k', icon: 'ti-swimming', tone: 'water' },
        { id: 'safari', label: 'Safari', value: '21k', icon: 'ti-paw', tone: 'water' },
        { id: 'grandworld', label: 'Grand World', value: '46k', icon: 'ti-building-carousel', tone: 'media' },
        { id: 'vinbus', label: 'VinBus nội khu', value: '128k', icon: 'ti-bus', tone: 'power' },
        { id: 'vinmec', label: 'Vinmec', value: '7.8k', icon: 'ti-first-aid-kit', tone: 'water' },
      ],
    },
    serviceMap: {
      residentPct: 86,
      lots: [
        { label: 'WaterPark', value: 86, metric: '38k/26k', tone: 'ok' },
        { label: 'Safari', value: 72, metric: '15k/6k', tone: 'ok' },
        { label: 'GrandWorld', value: 79, metric: '31k/15k', tone: 'ok' },
        { label: 'Marina', value: 64, metric: '9k/5k', tone: 'ok' },
      ],
    },
    flow: {
      checks: [
        { label: 'App cư dân', value: 'OK', tone: 'ok' },
        { label: 'QR vé', value: '99.2%', tone: 'ok' },
        { label: 'Phân luồng', value: 'Live', tone: 'ok' },
        { label: 'Vi phạm', value: '146', tone: 'ok' },
      ],
    },
    loadTowers: {
      bars: [
        { label: 'T1', value: 52, note: 'App' },
        { label: 'T2', value: 61, note: 'VinBus' },
        { label: 'T3', value: 73, note: 'Water' },
        { label: 'T4', value: 79, note: 'G.World' },
        { label: 'T5', value: 88, note: 'Cao điểm' },
        { label: 'T6', value: 67, note: 'Ổn định' },
      ],
      services: [
        ['WaterPark', '64k'],
        ['VinBus', '128k'],
        ['Grand World', '46k'],
        ['App cư dân', '99.2%'],
      ],
    },
    rulesRadar: {
      violations: [
        { label: 'Water', value: 54, tone: 'hot' },
        { label: 'Safari', value: 18, tone: 'ok' },
        { label: 'G.World', value: 31, tone: 'warn' },
        { label: 'Beach', value: 12, tone: 'ok' },
        { label: 'VinBus', value: 26, tone: 'warn' },
        { label: 'Vincom', value: 5, tone: 'ok' },
      ],
    },
    vinStandard: {
      items: [
        { label: 'Đóng phí', value: 18420, pct: 58, color: '#00d4ff' },
        { label: 'Water cư dân', value: 38000, pct: 24, color: '#85b7eb' },
        { label: 'Water khách', value: 26000, pct: 16, color: '#185fa5' },
        { label: 'Vi phạm', value: 146, pct: 2, color: '#2b7fc3' },
      ],
    },
    serviceAlerts: {
      alerts: [
        { label: 'WaterPark', value: 54 },
        { label: 'Safari', value: 18 },
        { label: 'VinBus', value: 26 },
      ],
      summary: [
        ['54', 'vượt khung'],
        ['18', 'sai ưu đãi'],
        ['128k', 'VinBus'],
      ],
    },
  },
  reports: {
    summary: {
      slaPct: 92,
      chips: [
        { value: '42.318', label: 'Cư dân hiện diện' },
        { value: '96%', label: 'PCCC sẵn sàng' },
        { value: '128', label: 'Camera online' },
        { value: '85%', label: 'Hạ tầng ổn định', warn: true },
      ],
    },
    timeline: {
      items: [
        { time: '16:00', id: 'Tổng quan', status: '42.318 cư dân', tone: 'ok' },
        { time: '17:20', id: 'Giao thông', status: 'A4 tải 78%', tone: 'warn' },
        { time: '18:05', id: 'PCCC', status: '2 tòa nguy cơ', tone: 'warn' },
        { time: '19:30', id: 'Dịch vụ', status: 'VinBus 128k', tone: 'ok' },
      ],
      cases: smartReportCases,
    },
    resolution: {
      points: [
        { label: 'Tháng 03', value: 88, x: 16, y: 24 },
        { label: 'Tháng 04', value: 64, x: 62, y: 39 },
        { label: 'Tháng 05', value: 76, x: 104, y: 32 },
        { label: 'Tháng 06', value: 96, x: 136, y: 17 },
      ],
      violationDetails: trafficViolationDetails,
    },
    incidentMatrix: {
      items: [
        { label: 'Camera AI', value: 94 },
        { label: 'Tuần tra', value: 88 },
        { label: 'Điểm nóng', value: 76 },
        { label: 'Sự cố cư dân', value: 67 },
        { label: 'SLA phản ứng', value: 91 },
      ],
    },
    overviewMap: {
      kpis: [
        { value: '18:30', label: 'Báo cáo mới' },
        { value: '24', label: 'Đã tạo' },
        { value: '7', label: 'Theo dõi' },
        { value: '3', label: 'Ưu tiên' },
      ],
    },
    sensorChart: {
      bars: [
        { label: 'Giao thông', value: 42 },
        { label: 'An ninh', value: 18 },
        { label: 'Hạ tầng', value: 23 },
        { label: 'Dịch vụ', value: 31 },
      ],
      incidentDetails: reportIncidentDetails,
    },
    sendCard: {
      steps: [
        ['IOC', 'Dữ liệu ca', 'ti-database'],
        ['16', 'Báo cáo', 'ti-chart-bar'],
        ['Xuất', 'Tổng hợp', 'ti-file-export'],
        ['Cấp trên', 'Chờ gửi', 'ti-send'],
      ],
      summary: [
        ['16', 'Báo cáo'],
        ['13', 'Cần theo dõi'],
        ['19%', 'Closed-loop'],
      ],
    },
    adviceCard: {
      notes: [
        ['ti-users-group', '01'],
        ['ti-bolt', '02'],
        ['ti-file-check', '03'],
      ],
    },
  },
};
