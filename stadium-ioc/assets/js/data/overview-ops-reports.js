import { getCrowdSnapshot } from './crowd-state.js';

const snap = getCrowdSnapshot();

/** Báo cáo yêu cầu đã gửi / đã xử lý — tab Tổng quan */
export const overviewOpsReports = {
  venue: {
    title: 'Trạng thái sân PVF',
    capacity: snap.totalFormatted,
    capacityLabel: `Khán giả / ${snap.capacityFormatted} chỗ`,
    pct: snap.fillPercent,
  },
  categories: [
    {
      id: 'medical',
      icon: 'ti-first-aid-kit',
      title: 'Gọi y tế',
      dispatchId: 'medical',
      dispatchType: 'medical',
      sent: 14,
      processed: 11,
      pending: [
        {
          id: 'YT-2405-08',
          title: 'Khán đài B — cổ động viên ngất',
          zone: 'Khán đài B · Lối 8',
          sentAt: '19:42',
          wait: '12 phút',
          reason: 'Đội y tế ca B chưa xác nhận tiếp nhận trên VOC-11',
          handler: 'Lê Minh Tuấn · Trưởng ca y tế B',
        },
        {
          id: 'YT-2405-11',
          title: 'VIP — hạ đường huyết',
          zone: 'Khu VIP · Phòng y tế A',
          sentAt: '19:51',
          wait: '3 phút',
          reason: 'Đang chờ bác sĩ trực chuyển từ phòng y tế chính',
          handler: 'Phạm Thu Hà · Điều phối y tế VOC',
        },
      ],
    },
    {
      id: 'fire',
      icon: 'ti-flame',
      title: 'Gọi cứu hỏa',
      dispatchId: 'medical',
      dispatchType: 'fire',
      sent: 5,
      processed: 4,
      pending: [
        {
          id: 'CH-2405-02',
          title: 'Cảnh báo khói nhẹ — khu bếp B',
          zone: 'Khán đài B · F&B tầng 2',
          sentAt: '19:38',
          wait: '16 phút',
          reason: 'Đội PCCC chưa cập nhật trạng thái khắc phụt trên bảng VOC',
          handler: 'Trần Quốc Bảo · Trưởng ca PCCC',
        },
      ],
    },
    {
      id: 'crowd',
      icon: 'ti-users-group',
      title: 'Quá tải & dẫm đạp',
      dispatchId: 'security',
      dispatchType: 'crowd',
      sent: 9,
      processed: 6,
      pending: [
        {
          id: 'AD-2405-04',
          title: 'Mật độ vượt ngưỡng — Khán đài B',
          zone: 'Khán đài B · Lối 12',
          sentAt: '19:45',
          wait: '9 phút',
          reason: 'Đội an ninh đám đông chưa báo cáo hoàn tất điều tiết',
          handler: 'Nguyễn Đức Anh · Trưởng ca an ninh B',
        },
        {
          id: 'AD-2405-05',
          title: 'Chen lấn cổng phụ C1',
          zone: 'Cổng C1 · Hành lang vào',
          sentAt: '19:49',
          wait: '5 phút',
          reason: 'Chờ xác nhận mở lối sơ tán từ điều phối VOC-22',
          handler: 'Hoàng Văn Kiệt · Điều phối sơ tán',
        },
        {
          id: 'AD-2405-06',
          title: 'Báo cáo dẫm đạp tiềm ẩn — Nam',
          zone: 'Khán đài Nam · Lối 3',
          sentAt: '19:52',
          wait: '2 phút',
          reason: 'Yêu cầu mới — đang phân công lực lượng',
          handler: 'Phòng điều hành an ninh VOC',
        },
      ],
    },
  ],
};
