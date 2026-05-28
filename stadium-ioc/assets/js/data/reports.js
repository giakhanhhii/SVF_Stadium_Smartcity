export const reportsData = {
  history: [
    { id: 'BC-2405-18', title: 'Mật độ khán đài B vượt ngưỡng', time: '20:14', status: 'Đã xử lý', tone: 'ok' },
    { id: 'BC-2405-17', title: 'Y tế cổng A cần hỗ trợ cáng', time: '19:58', status: 'Báo lần 2', tone: 'warn' },
    { id: 'BC-2405-16', title: 'Sụt áp khu kiosk C2', time: '19:35', status: 'Đã xử lý', tone: 'ok' },
    { id: 'BC-2405-15', title: 'Khói nhẹ khu bếp B', time: '19:22', status: 'Đã chuyển PCCC', tone: 'danger' },
  ],
  simulatedHistory: [
    { id: 'BC-DEMO-03', title: 'Camera cổng D mất tín hiệu 4 phút', time: '18:54', status: 'Đã khôi phục', tone: 'ok', source: 'Giả lập' },
    { id: 'BC-DEMO-02', title: 'Ùn ứ bãi xe P4 sau giờ mở cổng', time: '18:31', status: 'Đã điều tiết', tone: 'warn', source: 'Giả lập' },
    { id: 'BC-DEMO-01', title: 'Quầy dịch vụ B3 thiếu nước đóng chai', time: '18:12', status: 'Đã bổ sung', tone: 'ok', source: 'Giả lập' },
  ],
  resolution: [
    { label: 'Xử lý sau báo cáo lần 1', value: 72, color: '#1D9E75' },
    { label: 'Xử lý sau báo cáo lần 2', value: 91, color: '#EF9F27' },
    { label: 'Closed-loop sau giám sát VOC', value: 97, color: '#00D4FF' },
  ],
  incidentMix: [
    { label: 'Quá tải / chen lấn', value: 38, color: '#E24B4A' },
    { label: 'Y tế', value: 24, color: '#1D9E75' },
    { label: 'Cháy nổ / khói', value: 11, color: '#EF9F27' },
    { label: 'Nguồn điện', value: 17, color: '#185FA5' },
    { label: 'Khác', value: 10, color: '#534AB7' },
  ],
  managementNotes: [
    'Tăng tổ phản ứng nhanh tại khán đài B trước giờ cao điểm.',
    'Bổ sung kiểm tra điện kiosk C2 trước khi mở cổng.',
    'Chuẩn hóa mẫu báo cáo lần 2 để giảm thời gian xác nhận.',
  ],
};
