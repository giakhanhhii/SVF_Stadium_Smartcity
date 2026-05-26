import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outPath = process.env.KE_HOACH_OUT
  ? path.resolve(process.env.KE_HOACH_OUT)
  : path.join(root, 'NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC.xlsx');
const CHART_SHEET = 'ChartData';

async function writeWorkbook(wb, target) {
  try {
    await wb.xlsx.writeFile(target);
    return target;
  } catch (err) {
    if (err.code === 'EBUSY') {
      const alt = path.join(root, 'NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC_new.xlsx');
      await wb.xlsx.writeFile(alt);
      console.warn('File locked — saved as:', alt);
      return alt;
    }
    throw err;
  }
}

const COLORS = {
  orange: 'FFE26B0A',
  orangeDark: 'FFC55A11',
  greenWeek: 'FF548235',
  greenWeekAlt: 'FFBF8F00',
  black: 'FF000000',
  white: 'FFFFFFFF',
  doneBg: 'FFC6EFCE',
  doneText: 'FF006100',
  todoBg: 'FFFFC7CE',
  todoText: 'FF9C0006',
  wipBg: 'FFE6F1FB',
  wipText: 'FF185FA5',
  rowAlt: 'FFF2F2F2',
  rowWhite: 'FFFFFFFF',
  grayText: 'FF505050',
  purpleWeek: 'FF7030A0',
  grayWeek: 'FF404040',
};

const WEEK_BANNER_COLORS = [COLORS.orange, COLORS.greenWeek, COLORS.greenWeekAlt];
const LAST = 'F';

function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FF000000' } };
  return { top: s, left: s, bottom: s, right: s };
}

function styleCells(row, fromCol, toCol, fn) {
  for (let c = fromCol; c <= toCol; c++) fn(row.getCell(c), c);
}

function styleHeaderRow(row, fromCol, toCol) {
  row.height = 24;
  styleCells(row, fromCol, toCol, (cell) => {
    cell.font = { bold: true, color: { argb: COLORS.black }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.orange } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder();
  });
}

function mergeTitle(ws, rowNum, text, lastCol = LAST) {
  ws.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
  const cell = ws.getCell(`A${rowNum}`);
  cell.value = text;
  cell.font = { bold: true, size: 14, color: { argb: COLORS.black } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function mergeSubtitle(ws, rowNum, text, lastCol = LAST) {
  ws.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
  ws.getCell(`A${rowNum}`).value = text;
  ws.getCell(`A${rowNum}`).font = { size: 10, color: { argb: COLORS.grayText } };
  ws.getCell(`A${rowNum}`).alignment = { horizontal: 'center', wrapText: true };
}

function sectionTitle(ws, rowNum, text, lastCol = LAST) {
  ws.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
  const cell = ws.getCell(`A${rowNum}`);
  cell.value = text;
  cell.font = { bold: true, size: 11, color: { argb: COLORS.black } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.orange } };
  cell.alignment = { vertical: 'middle' };
  cell.border = thinBorder();
}

function weekBanner(ws, rowNum, text, bg = COLORS.greenWeek) {
  ws.mergeCells(`A${rowNum}:${LAST}${rowNum}`);
  const cell = ws.getCell(`A${rowNum}`);
  cell.value = text;
  cell.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.alignment = { vertical: 'middle', wrapText: true };
  cell.border = thinBorder();
}

function applyStatusStyle(cell, status) {
  cell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  if (status === 'Hoàn thành') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.doneBg } };
    cell.font = { color: { argb: COLORS.doneText }, bold: true };
  } else if (status === 'Đang thực hiện') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.wipBg } };
    cell.font = { color: { argb: COLORS.wipText }, bold: true };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.todoBg } };
    cell.font = { color: { argb: COLORS.todoText }, bold: true };
  }
}

/** Bảng công việc 6 cột: C:D = mô tả+kết quả (merge), E = tiến độ, F = ghi chú */
function taskRow(ws, rowNum, [id, title, desc, status, result, note], stripe) {
  const bg = stripe ? COLORS.rowAlt : COLORS.rowWhite;
  ws.getCell(`A${rowNum}`).value = id;
  ws.getCell(`B${rowNum}`).value = title;
  ws.mergeCells(`C${rowNum}:D${rowNum}`);
  ws.getCell(`C${rowNum}`).value = result ? `${desc}\n→ Kết quả: ${result}` : desc;
  ws.getCell(`E${rowNum}`).value = status;
  ws.getCell(`F${rowNum}`).value = note;

  styleCells(ws.getRow(rowNum), 1, 6, (cell, col) => {
    cell.border = thinBorder();
    cell.alignment = {
      vertical: 'top',
      wrapText: true,
      horizontal: col === 1 || col === 5 ? 'center' : 'left',
    };
    if (col !== 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    }
  });
  applyStatusStyle(ws.getCell(`E${rowNum}`), status);
}

function simpleRow(ws, rowNum, values, lastCol, stripe = false) {
  const bg = stripe ? COLORS.rowAlt : COLORS.rowWhite;
  values.forEach((v, i) => {
    ws.getCell(rowNum, i + 1).value = v;
  });
  styleCells(ws.getRow(rowNum), 1, lastCol, (cell) => {
    cell.border = thinBorder();
    cell.alignment = { wrapText: true, vertical: 'top' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  });
}

/** Hàng 3 cột: B:C merge cho cột nhiều chữ */
function leadershipRow(ws, rowNum, [cat, action, when], stripe) {
  ws.getCell(`A${rowNum}`).value = cat;
  ws.mergeCells(`B${rowNum}:C${rowNum}`);
  ws.getCell(`B${rowNum}`).value = action;
  ws.getCell(`D${rowNum}`).value = when;
  const bg = stripe ? COLORS.rowAlt : COLORS.rowWhite;
  ['A', 'D'].forEach((col) => {
    const cell = ws.getCell(`${col}${rowNum}`);
    cell.border = thinBorder();
    cell.alignment = { wrapText: true, vertical: 'top', horizontal: col === 'D' ? 'center' : 'left' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  });
  ['B'].forEach(() => {
    const cell = ws.getCell(`B${rowNum}`);
    cell.border = thinBorder();
    cell.alignment = { wrapText: true, vertical: 'top' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  });
}

function riskRow(ws, rowNum, [risk, fix], stripe, lastCol = 'F') {
  ws.getCell(`A${rowNum}`).value = risk;
  ws.mergeCells(`B${rowNum}:${lastCol}${rowNum}`);
  ws.getCell(`B${rowNum}`).value = fix;
  const bg = stripe ? COLORS.rowAlt : COLORS.rowWhite;
  ws.getCell(`A${rowNum}`).border = thinBorder();
  ws.getCell(`A${rowNum}`).alignment = { wrapText: true, vertical: 'top' };
  ws.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  ws.getCell(`B${rowNum}`).border = thinBorder();
  ws.getCell(`B${rowNum}`).alignment = { wrapText: true, vertical: 'top' };
  ws.getCell(`B${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
}

function scopeRow(ws, rowNum, [stt, tab, content, voc], stripe) {
  ws.getCell(`A${rowNum}`).value = stt;
  ws.getCell(`B${rowNum}`).value = tab;
  ws.mergeCells(`C${rowNum}:D${rowNum}`);
  ws.getCell(`C${rowNum}`).value = content;
  ws.getCell(`E${rowNum}`).value = voc;
  const bg = stripe ? COLORS.rowAlt : COLORS.rowWhite;
  styleCells(ws.getRow(rowNum), 1, 5, (cell, col) => {
    cell.border = thinBorder();
    cell.alignment = { wrapText: true, vertical: 'top', horizontal: col === 1 ? 'center' : 'left' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  });
}

function setColumnWidths(ws) {
  ws.columns = [
    { width: 6 }, { width: 24 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 14 },
  ];
}

function setOverviewWidths(ws) {
  ws.columns = [
    { width: 14 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 18 },
  ];
}

function buildChartDataSheet(wb) {
  const ws = wb.addWorksheet(CHART_SHEET, { state: 'hidden' });

  const blocks = [
    { ref: 'overview', start: [1, 1], headers: ['Tuần', 'PVF', 'Smart City'], rows: [
      ['T1', 1, 0], ['T2', 1, 0], ['T3', 1, 0], ['T4', 0, 1], ['T5', 0, 1], ['T6', 0, 1],
    ]},
    { ref: 'pvfTabs', start: [1, 5], headers: ['Tab', 'Số tab'], rows: [
      ['Tổng quan', 1], ['An ninh', 1], ['Sự kiện', 1], ['Cơ sở HT', 1], ['Dịch vụ', 1], ['Báo cáo', 1],
    ]},
    { ref: 'pvfWeeks', start: [1, 8], headers: ['Tuần', 'Công việc'], rows: [
      ['Tuần 1', 4], ['Tuần 2', 4], ['Tuần 3', 3],
    ]},
    { ref: 'scLayout', start: [1, 11], headers: ['Layout', 'Số tab'], rows: [
      ['Ops classic', 4], ['Command 3D', 2],
    ]},
    { ref: 'scWeeks', start: [1, 14], headers: ['Tuần', 'Công việc'], rows: [
      ['Tuần 4', 3], ['Tuần 5', 4], ['Tuần 6', 3],
    ]},
  ];

  const refs = {};
  for (const block of blocks) {
    const [sr, sc] = block.start;
    block.headers.forEach((h, i) => { ws.getCell(sr, sc + i).value = h; });
    block.rows.forEach((row, ri) => {
      row.forEach((v, ci) => { ws.getCell(sr + 1 + ri, sc + ci).value = v; });
    });
    const ec = sc + block.headers.length - 1;
    const er = sr + block.rows.length;
    const startCol = String.fromCharCode(64 + sc);
    const endCol = String.fromCharCode(64 + ec);
    refs[block.ref] = `'${CHART_SHEET}'!$${startCol}$${sr}:$${endCol}$${er}`;
  }
  return refs;
}

function buildPvfSheet(wb) {
  const ws = wb.addWorksheet('IOC Sân vận động PVF', {
    views: [{ showGridLines: false, rightToLeft: false }],
  });
  setColumnWidths(ws);

  mergeTitle(ws, 1, 'KẾ HOẠCH TRIỂN KHAI — IOC SÂN VẬN ĐỘNG PVF (Giai đoạn 1: Tuần 1–3)');
  mergeSubtitle(ws, 2, 'Dự án Vinsmartcity  |  25/05 – 14/06/2026  |  Nguyễn Triệu Gia Khánh  |  Chuẩn VOC–FIFA');

  sectionTitle(ws, 4, 'TÓM TẮT CHO BAN LÃNH ĐẠO');
  [
    '• Ưu tiên triển khai trước Smart City — phục vụ ban vận hành sân / an ninh sự kiện.',
    '• Phạm vi 6 tuần: prototype web 6 tab + BRD/SRS/Kiến trúc + mô phỏng mái vòm (chưa nối BMS/SCADA thật).',
    '• Tích hợp VOC theo khung vận hành venue FIFA; nghiệm thu cuối tuần 3.',
    '• Nguồn thông số sân: VnExpress (video nhúng trong bài) — 60.000 chỗ, mái vòm 12–20 phút, Hưng Yên.',
  ].forEach((line, i) => {
    ws.mergeCells(`A${5 + i}:F${5 + i}`);
    ws.getCell(`A${5 + i}`).value = line;
    ws.getCell(`A${5 + i}`).alignment = { wrapText: true };
  });

  let r = 10;
  styleHeaderRow(ws.getRow(r), 1, 6);
  ws.getCell(`A${r}`).value = '#';
  ws.getCell(`B${r}`).value = 'Đầu mục công việc';
  ws.mergeCells(`C${r}:D${r}`);
  ws.getCell(`C${r}`).value = 'Mô tả / Kết quả đạt được';
  ws.getCell(`E${r}`).value = 'Tiến độ';
  ws.getCell(`F${r}`).value = 'Ghi chú';
  r++;

  const weeks = [
    ['TUẦN 1 (25/05 – 31/05) — Kickoff, BRD/SRS, prototype 6 tab, căn VOC–FIFA', 0, [
      ['1.1', 'Kickoff PVF & xác nhận phạm vi VOC–FIFA', 'Họp mở đầu; chốt phạm vi 6 tab PVF với ban lãnh đạo', 'Đang thực hiện', 'Biên bản kickoff + phạm vi VOC thống nhất', 'Tuần 1'],
      ['1.2', 'Soạn BRD/SRS PVF', 'Ghi rõ 60.000 chỗ, mái vòm, yêu cầu VOC–FIFA', 'Đang thực hiện', 'BRD/SRS bản 1', 'Tuần 1'],
      ['1.3', 'Branding & prototype 6 tab', 'stadium-ioc/ — 6 tab venue', 'Đang thực hiện', 'Prototype xem trước demo VOC', 'Tuần 1'],
      ['1.4', 'Căn thông số sân PVF', 'Tham chiếu VnExpress (video): quy mô, mái vòm, cỏ hybrid', 'Chưa làm', 'Bảng thông số đối chiếu nguồn', 'VnExpress'],
    ]],
    ['TUẦN 2 (01/06 – 07/06) — Mô phỏng mái vòm, kiến trúc, kiểm thử phòng điều hành', 1, [
      ['2.1', 'Mô phỏng đóng/mở mái vòm', 'Tab Cơ sở hạ tầng: trạng thái, tiến trình 12–20 phút, phanh khẩn cấp', 'Chưa làm', 'Luồng vận hành mái trên prototype', 'Demo'],
      ['2.2', 'Tài liệu kiến trúc PVF', 'Dual IOC + điểm tích hợp VOC (camera, BMS, ticketing…)', 'Chưa làm', 'Kiến trúc bản 1', 'Tuần 2'],
      ['2.3', 'Kiểm thử phòng điều hành / VOC', 'Demo trên màn hình phòng điều hành; thu feedback', 'Chưa làm', 'Biên bản kiểm thử nội bộ', 'Cần môi trường demo'],
      ['2.4', 'Duyệt BRD/SRS (lãnh đạo)', 'Phê duyệt phạm vi trước nghiệm thu tuần 3', 'Chưa làm', 'BRD/SRS đã ký duyệt', 'Yêu cầu lãnh đạo'],
    ]],
    ['TUẦN 3 (08/06 – 14/06) — UAT & nghiệm thu PVF', 2, [
      ['3.1', 'UAT PVF', '1 đại diện ban vận hành sân — kiểm thử 6 tab + mô phỏng mái', 'Chưa làm', 'Biên bản UAT PVF', 'Tuần 3'],
      ['3.2', 'Cập nhật tài liệu sau UAT', 'BRD, SRS, Kiến trúc PVF (60k chỗ, mái vòm, VOC)', 'Chưa làm', 'Bộ tài liệu PVF hoàn chỉnh', 'Tuần 3'],
      ['3.3', 'Nghiệm thu & bàn giao gói PVF', 'Ký checklist; bàn giao prototype + tài liệu', 'Chưa làm', 'PVF nghiệm thu — mở SC tuần 4', 'Mốc quan trọng'],
    ]],
  ];

  let stripe = false;
  for (const [banner, colorIdx, tasks] of weeks) {
    weekBanner(ws, r, banner, WEEK_BANNER_COLORS[colorIdx] ?? COLORS.greenWeek);
    r++;
    for (const t of tasks) {
      taskRow(ws, r, t, stripe);
      stripe = !stripe;
      r++;
    }
  }

  r++;
  sectionTitle(ws, r, 'PHẠM VI 6 TAB PVF (ánh xạ VOC–FIFA)', 'E');
  r++;
  styleHeaderRow(ws.getRow(r), 1, 5);
  ws.getCell(`A${r}`).value = 'STT';
  ws.getCell(`B${r}`).value = 'Tab';
  ws.mergeCells(`C${r}:D${r}`);
  ws.getCell(`C${r}`).value = 'Nội dung chính';
  ws.getCell(`E${r}`).value = 'Nhóm VOC';
  r++;
  stripe = false;
  for (const t of [
    ['1', 'Tổng quan', 'Trạng thái sân, 60.000 chỗ, sự kiện, icon mái vòm', 'Dashboard VOC tổng'],
    ['2', 'An ninh', 'Camera + sơ đồ sân, mật độ khán giả', 'Safety & security'],
    ['3', 'Sự kiện', 'Timeline trận đấu / sự kiện', 'Event operations'],
    ['4', 'Cơ sở hạ tầng', 'Điện, HVAC, mô phỏng mái vòm', 'Technical operations'],
    ['5', 'Dịch vụ', 'F&B, bãi xe, VIP', 'Spectator services'],
    ['6', 'Báo cáo', 'KPI vận hành theo trận', 'Reporting'],
  ]) {
    scopeRow(ws, r, t, stripe);
    stripe = !stripe;
    r++;
  }

  ws.pageSetup = { printArea: 'A1:F' + r, fitToPage: true, fitToWidth: 1 };
  return r;
}

function buildSmartCitySheet(wb) {
  const ws = wb.addWorksheet('IOC Smart City', { views: [{ showGridLines: false }] });
  setColumnWidths(ws);

  mergeTitle(ws, 1, 'KẾ HOẠCH TRIỂN KHAI — IOC SMART CITY (Giai đoạn 2: Tuần 4–6)');
  mergeSubtitle(ws, 2, 'Dự án Vinsmartcity  |  15/06 – 05/07/2026  |  Nguyễn Triệu Gia Khánh  |  Bắt đầu sau nghiệm thu PVF');

  sectionTitle(ws, 4, 'TÓM TẮT CHO BAN LÃNH ĐẠO');
  [
    '• Triển khai sau khi PVF nghiệm thu tuần 3 — phục vụ ban quản lý đô thị / khu thông minh.',
    '• Phạm vi: prototype 6 tab (2 tab Command Center 3D: Giao thông & An ninh).',
    '• Liên kết chéo Smart City ↔ PVF trên header (1 click).',
    '• Nghiệm thu tổng thể & bàn giao full pack cuối tuần 6.',
  ].forEach((line, i) => {
    ws.mergeCells(`A${5 + i}:F${5 + i}`);
    ws.getCell(`A${5 + i}`).value = line;
    ws.getCell(`A${5 + i}`).alignment = { wrapText: true };
  });

  let r = 10;
  styleHeaderRow(ws.getRow(r), 1, 6);
  ws.getCell(`A${r}`).value = '#';
  ws.getCell(`B${r}`).value = 'Đầu mục công việc';
  ws.mergeCells(`C${r}:D${r}`);
  ws.getCell(`C${r}`).value = 'Mô tả / Kết quả đạt được';
  ws.getCell(`E${r}`).value = 'Tiến độ';
  ws.getCell(`F${r}`).value = 'Ghi chú';
  r++;

  const scWeekColors = [COLORS.orangeDark, COLORS.purpleWeek, COLORS.grayWeek];
  const weeks = [
    ['TUẦN 4 (15/06 – 21/06) — BRD/SRS Smart City & 2 tab cốt lõi 3D', 0, [
      ['4.1', 'Soạn BRD/SRS Smart City', 'Phạm vi 6 tab, người dùng mục tiêu ban quản lý đô thị', 'Chưa làm', 'BRD/SRS SC bản 1', 'Tuần 4'],
      ['4.2', 'Prototype An ninh & Giao thông 3D', 'Command Center: scene Three.js + HUD hai bên', 'Chưa làm', '2 tab cốt lõi hoàn chỉnh', 'smartcity-ioc/'],
      ['4.3', 'Tham chiếu mockup nguồn', 'ioc_smartcity_homepage_mockup.html, ioc_realtime_dashboard.html', 'Chưa làm', 'UI đồng bộ mockup', 'Tuần 4'],
    ]],
    ['TUẦN 5 (22/06 – 28/06) — 4 tab còn lại, kiến trúc dual IOC, liên kết PVF', 1, [
      ['5.1', 'Hoàn thiện 4 tab còn lại', 'Tổng quan, Môi trường, Tiện ích, Báo cáo', 'Chưa làm', '6 tab Smart City đầy đủ', 'Tuần 5'],
      ['5.2', 'Tài liệu kiến trúc dual IOC', 'Cấu trúc shared-ioc, cross-link, tích hợp tương lai', 'Chưa làm', 'Kiến trúc tổng bản 1', 'Tuần 5'],
      ['5.3', 'Liên kết Smart City ↔ PVF', 'Center-switch trên header; deep link từ overview', 'Chưa làm', 'Chuyển IOC 1 click', 'Tuần 5–6'],
      ['5.4', 'Duyệt BRD/SRS Smart City', 'Phê duyệt phạm vi trước UAT tuần 6', 'Chưa làm', 'BRD/SRS SC đã duyệt', 'Yêu cầu lãnh đạo'],
    ]],
    ['TUẦN 6 (29/06 – 05/07) — UAT tổng & bàn giao full pack', 2, [
      ['6.1', 'UAT Smart City', '1–2 đại diện ban quản lý đô thị — kiểm thử 6 tab', 'Chưa làm', 'Biên bản UAT SC', 'Tuần 6'],
      ['6.2', 'Hoàn thiện toàn bộ tài liệu', 'BRD, SRS, Kiến trúc SC + nghiên cứu UI', 'Chưa làm', 'Full bộ tài liệu sản phẩm', 'Tuần 6'],
      ['6.3', 'Demo / training & nghiệm thu tổng', 'Buổi tổng kết; bàn giao prototype + tài liệu', 'Chưa làm', 'Dự án hoàn thành', 'Mốc cuối'],
    ]],
  ];

  let stripe = false;
  for (const [banner, colorIdx, tasks] of weeks) {
    weekBanner(ws, r, banner, scWeekColors[colorIdx] ?? COLORS.greenWeek);
    r++;
    for (const t of tasks) {
      taskRow(ws, r, t, stripe);
      stripe = !stripe;
      r++;
    }
  }

  r++;
  sectionTitle(ws, r, 'PHẠM VI 6 TAB SMART CITY', 'E');
  r++;
  styleHeaderRow(ws.getRow(r), 1, 5);
  ws.getCell(`A${r}`).value = 'STT';
  ws.getCell(`B${r}`).value = 'Tab';
  ws.mergeCells(`C${r}:D${r}`);
  ws.getCell(`C${r}`).value = 'Nội dung chính';
  ws.getCell(`E${r}`).value = 'Layout';
  r++;
  stripe = false;
  for (const t of [
    ['1', 'Tổng quan', 'Chỉ số tổng thể, cổng phân hệ (link PVF)', 'Ops classic'],
    ['2', 'Giao thông', 'Ngã tư 3D + bảng điều khiển', 'Command Center 3D'],
    ['3', 'An ninh', 'Khu đô thị 3D + camera, cảnh báo', 'Command Center 3D'],
    ['4', 'Môi trường', 'AQI, trạm đo, biểu đồ', 'Ops classic'],
    ['5', 'Tiện ích', 'Điện, nước, chiếu sáng', 'Ops classic'],
    ['6', 'Báo cáo', 'Bảng số liệu, biểu đồ tổng hợp', 'Ops classic'],
  ]) {
    scopeRow(ws, r, t, stripe);
    stripe = !stripe;
    r++;
  }

  ws.pageSetup = { printArea: 'A1:F' + r, fitToPage: true, fitToWidth: 1 };
  return r;
}

function buildOverviewSheet(wb) {
  const ws = wb.addWorksheet('Tổng quan dự án', { views: [{ showGridLines: false }] });
  setOverviewWidths(ws);
  const LC = 'E';

  mergeTitle(ws, 1, 'BÁO CÁO KẾ HOẠCH 6 TUẦN — IOC PVF & SMART CITY', LC);
  mergeSubtitle(ws, 2, 'Vinsmartcity  |  25/05 – 05/07/2026  |  Nguyễn Triệu Gia Khánh  |  Trạng thái: Tuần 1 — PVF', LC);

  sectionTitle(ws, 4, 'LỘ TRÌNH 6 TUẦN (PVF trước → Smart City sau)', LC);
  styleHeaderRow(ws.getRow(5), 1, 5);
  ['Giai đoạn', 'Tuần', 'Thời gian', 'Trọng tâm', 'Nghiệm thu'].forEach((h, i) => {
    ws.getCell(5, i + 1).value = h;
  });

  const roadmap = [
    ['PVF', '1', '25/05 – 31/05', 'Kickoff; BRD/SRS; prototype 6 tab; VOC–FIFA', '—'],
    ['PVF', '2', '01/06 – 07/06', 'Mô phỏng mái vòm; kiến trúc; kiểm thử VOC', '—'],
    ['PVF', '3', '08/06 – 14/06', 'UAT PVF; bàn giao tài liệu PVF', 'Nghiệm thu PVF'],
    ['Smart City', '4', '15/06 – 21/06', 'BRD/SRS SC; An ninh & Giao thông 3D', '—'],
    ['Smart City', '5', '22/06 – 28/06', '4 tab còn lại; kiến trúc dual IOC; link PVF', '—'],
    ['Smart City', '6', '29/06 – 05/07', 'UAT tổng; bàn giao full pack', 'Nghiệm thu tổng'],
  ];
  roadmap.forEach((item, i) => {
    const rowNum = 6 + i;
    ws.getCell(`A${rowNum}`).value = item[0];
    ws.getCell(`B${rowNum}`).value = item[1];
    ws.getCell(`C${rowNum}`).value = item[2];
    ws.mergeCells(`D${rowNum}:E${rowNum}`);
    ws.getCell(`D${rowNum}`).value = item[3];
    // Nghiệm thu as note in merged cell if present
    if (item[4] !== '—') {
      ws.getCell(`D${rowNum}`).value = `${item[3]}\n→ ${item[4]}`;
    }
    const bg = i % 2 ? COLORS.rowAlt : COLORS.rowWhite;
    styleCells(ws.getRow(rowNum), 1, 5, (cell, col) => {
      cell.border = thinBorder();
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: col <= 2 ? 'center' : 'left' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    });
  });

  sectionTitle(ws, 13, 'YÊU CẦU PHỐI HỢP BAN LÃNH ĐẠO', 'D');
  styleHeaderRow(ws.getRow(14), 1, 4);
  ws.getCell('A14').value = 'Hạng mục';
  ws.mergeCells('B14:C14');
  ws.getCell('B14').value = 'Cần làm gì';
  ws.getCell('D14').value = 'Thời điểm';

  [
    ['Xác nhận ưu tiên PVF & VOC–FIFA', 'Đồng ý phạm vi VOC trên 6 tab PVF', 'Tuần 1'],
    ['Duyệt BRD/SRS', 'Phê duyệt phạm vi trước nghiệm thu', 'Tuần 2–3 / 5–6'],
    ['Đại diện nghiệm thu PVF', '1 người vận hành sân — UAT', 'Tuần 3'],
    ['Đại diện nghiệm thu Smart City', '1–2 người ban quản lý đô thị', 'Tuần 6'],
    ['Phản hồi định kỳ', 'Xem demo cuối tuần', 'Hàng tuần'],
    ['Môi trường demo', 'Màn hình phòng điều hành / VOC', 'Tuần 2 trở đi'],
  ].forEach((item, i) => {
    leadershipRow(ws, 15 + i, item, i % 2 === 1);
  });

  sectionTitle(ws, 22, 'RỦI RO & GIẢI PHÁP', 'E');
  styleHeaderRow(ws.getRow(23), 1, 2);
  ws.getCell('A23').value = 'Rủi ro';
  ws.mergeCells('B23:E23');
  ws.getCell('B23').value = 'Cách xử lý';

  [
    ['PVF chưa nghiệm thu kịp tuần 3', 'Smart City chỉ bắt đầu tuần 4 khi PVF đã ký duyệt'],
    ['VOC–FIFA chưa thống nhất sớm', 'Rà soát BRD tuần 1; chốt phạm vi trước tuần 2'],
    ['Chưa có API hệ thống thật', '6 tuần: prototype + tài liệu; tích hợp VOC sau'],
    ['Thay đổi yêu cầu giữa chừng', 'Cập nhật BRD/SRS; điều chỉnh lộ trình'],
    ['Tab 3D Smart City nặng máy cũ', 'Tối ưu tuần 5–6'],
  ].forEach((item, i) => {
    riskRow(ws, 24 + i, item, i % 2 === 1, 'E');
  });

  ws.pageSetup = { printArea: 'A1:E29', fitToPage: true, fitToWidth: 1 };
}

const wb = new ExcelJS.Workbook();
wb.creator = 'Nguyễn Triệu Gia Khánh';
wb.created = new Date();

const chartRefs = buildChartDataSheet(wb);
buildOverviewSheet(wb);
buildPvfSheet(wb);
buildSmartCitySheet(wb);

// Export chart ref map for PS script
import fs from 'fs';
fs.writeFileSync(
  path.join(__dirname, 'ke-hoach-chart-refs.json'),
  JSON.stringify(chartRefs, null, 2),
  'utf8',
);

const saved = await writeWorkbook(wb, outPath);
console.log('Exported:', saved);
