// IOC Smart City — Figma Prototype Builder
// Run: Plugins → Development → Import plugin from manifest → Run "IOC Smart City Prototype Builder"

const C = {
  bg: { r: 1, g: 1, b: 1 },
  bgSec: { r: 0.969, g: 0.969, b: 0.961 },
  bgInfo: { r: 0.902, g: 0.945, b: 0.984 },
  bgDanger: { r: 0.988, g: 0.922, b: 0.922 },
  text: { r: 0.102, g: 0.102, b: 0.094 },
  textSec: { r: 0.533, g: 0.529, b: 0.502 },
  textInfo: { r: 0.094, g: 0.373, b: 0.647 },
  textDanger: { r: 0.639, g: 0.176, b: 0.176 },
  border: { r: 0.898, g: 0.894, b: 0.875 },
  navy: { r: 0.016, g: 0.173, b: 0.325 },
  blue: { r: 0.094, g: 0.373, b: 0.647 },
  green: { r: 0.114, g: 0.620, b: 0.337 },
  orange: { r: 0.729, g: 0.459, b: 0.090 },
  red: { r: 0.639, g: 0.176, b: 0.176 },
};

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'traffic', label: 'Giao thông' },
  { id: 'security', label: 'An ninh' },
  { id: 'environment', label: 'Môi trường' },
  { id: 'utilities', label: 'Tiện ích' },
  { id: 'reports', label: 'Báo cáo' },
];

async function loadFont() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
}

function solid(color, opacity = 1) {
  return [{ type: 'SOLID', color, opacity }];
}

function stroke(color, weight = 0.5) {
  return [{ type: 'SOLID', color }];
}

function text(content, size, opts = {}) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: opts.bold ? 'Medium' : 'Regular' };
  t.characters = content;
  t.fontSize = size;
  t.fills = solid(opts.color || C.text);
  if (opts.opacity) t.opacity = opts.opacity;
  return t;
}

function autoFrame(name, dir, opts = {}) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.primaryAxisSizingMode = opts.primary || 'AUTO';
  f.counterAxisSizingMode = opts.counter || 'AUTO';
  f.itemSpacing = opts.gap ?? 0;
  f.paddingTop = opts.py ?? opts.p ?? 0;
  f.paddingBottom = opts.py ?? opts.p ?? 0;
  f.paddingLeft = opts.px ?? opts.p ?? 0;
  f.paddingRight = opts.px ?? opts.p ?? 0;
  f.fills = opts.fill !== undefined ? opts.fill : solid(C.bg);
  if (opts.stroke) {
    f.strokes = stroke(opts.stroke);
    f.strokeWeight = opts.strokeWeight ?? 0.5;
  }
  if (opts.radius) f.cornerRadius = opts.radius;
  if (opts.align) f.primaryAxisAlignItems = opts.align;
  if (opts.counterAlign) f.counterAxisAlignItems = opts.counterAlign;
  if (opts.layoutAlign) f.layoutAlign = opts.layoutAlign;
  if (opts.w) f.resize(opts.w, f.height);
  if (opts.h) f.resize(f.width, opts.h);
  return f;
}

function rect(w, h, color, radius = 0) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius;
  return r;
}

function circle(d, color) {
  const e = figma.createEllipse();
  e.resize(d, d);
  e.fills = solid(color);
  return e;
}

// ── Components ──

function buildNavItem(label, active) {
  const item = autoFrame(`Nav / ${label}`, 'VERTICAL', { gap: 4, py: 0, px: 0 });
  const lbl = text(label, 13, { bold: true, color: active ? C.textInfo : C.textSec });
  item.appendChild(lbl);
  if (active) {
    const line = rect(lbl.width, 2, C.textInfo);
    line.layoutAlign = 'STRETCH';
    item.appendChild(line);
  }
  return item;
}

function buildNavComponent() {
  const comp = autoFrame('Nav', 'HORIZONTAL', { gap: 22, p: 0 });
  NAV_ITEMS.forEach((n, i) => comp.appendChild(buildNavItem(n.label, i === 0)));
  const component = figma.createComponent();
  component.name = 'Nav';
  component.appendChild(comp);
  comp.x = 0; comp.y = 0;
  component.resize(comp.width, comp.height);
  return component;
}

function buildHeaderComponent(navComponent) {
  const header = autoFrame('Header', 'HORIZONTAL', {
    gap: 0, px: 24, py: 14, align: 'SPACE_BETWEEN', counterAlign: 'CENTER', w: 960,
  });
  header.strokes = stroke(C.border);
  header.strokeWeight = 0.5;
  header.strokeAlign = 'INSIDE';

  const brand = autoFrame('Brand', 'HORIZONTAL', { gap: 10 });
  const logo = autoFrame('Logo', 'HORIZONTAL', { p: 0, fill: solid(C.bgInfo), radius: 8, counterAlign: 'CENTER' });
  logo.appendChild(rect(36, 36, C.bgInfo, 8));
  const logoIcon = text('⬡', 18, { color: C.textInfo });
  logoIcon.x = 9; logoIcon.y = 8;
  logo.appendChild(logoIcon);
  brand.appendChild(logo);
  const brandText = autoFrame('BrandText', 'VERTICAL', { gap: 2 });
  brandText.appendChild(text('IOC Smart City', 15, { bold: true }));
  brandText.appendChild(text('Trung tâm điều hành thông minh', 11, { color: C.textSec }));
  brand.appendChild(brandText);
  header.appendChild(brand);

  const navInst = navComponent.createInstance();
  navInst.name = 'Nav Instance';
  header.appendChild(navInst);

  const actions = autoFrame('Actions', 'HORIZONTAL', { gap: 10, counterAlign: 'CENTER' });
  const bell = autoFrame('Bell', 'HORIZONTAL', { p: 0, counterAlign: 'CENTER' });
  bell.appendChild(text('🔔', 16, { color: C.textSec }));
  const badge = autoFrame('Badge', 'HORIZONTAL', { p: 0, fill: solid(C.bgDanger), radius: 7, counterAlign: 'CENTER' });
  badge.appendChild(text('7', 9, { bold: true, color: C.textDanger }));
  badge.resize(14, 14);
  bell.appendChild(badge);
  actions.appendChild(bell);
  const avatar = autoFrame('Avatar', 'HORIZONTAL', { p: 0, fill: solid(C.bgInfo), radius: 15, counterAlign: 'CENTER' });
  avatar.appendChild(text('QT', 11, { bold: true, color: C.textInfo }));
  avatar.resize(30, 30);
  actions.appendChild(avatar);
  header.appendChild(actions);

  const component = figma.createComponent();
  component.name = 'Header';
  component.appendChild(header);
  header.x = 0; header.y = 0;
  component.resize(960, header.height);
  return component;
}

// ── Page builders ──

function addHeader(frame, headerComp) {
  const inst = headerComp.createInstance();
  inst.layoutAlign = 'STRETCH';
  frame.appendChild(inst);
  return inst;
}

function buildOverviewFrame(headerComp) {
  const frame = autoFrame('01 — Tổng quan', 'VERTICAL', { gap: 0, w: 960, fill: solid(C.bg) });
  frame.clipsContent = true;
  addHeader(frame, headerComp);

  const hero = autoFrame('Hero', 'VERTICAL', { gap: 6, px: 32, py: 28, w: 960, h: 200, fill: solid(C.navy) });
  hero.appendChild(text('HỆ THỐNG ĐIỀU HÀNH ĐÔ THỊ THÔNG MINH', 11, { color: { r: 1, g: 1, b: 1 }, opacity: 0.8 }));
  hero.appendChild(text('Smart City Operations Center', 28, { bold: true, color: { r: 1, g: 1, b: 1 } }));
  hero.appendChild(text('Giám sát, phân tích và điều hành toàn diện hạ tầng đô thị theo thời gian thực', 12, { color: { r: 1, g: 1, b: 1 }, opacity: 0.75 }));
  const meta = autoFrame('Meta', 'HORIZONTAL', { gap: 16 });
  const status = autoFrame('Status', 'HORIZONTAL', { gap: 5, counterAlign: 'CENTER' });
  status.appendChild(circle(7, C.green));
  status.appendChild(text('Hệ thống hoạt động', 11, { color: { r: 1, g: 1, b: 1 } }));
  meta.appendChild(status);
  meta.appendChild(text('Cập nhật: 14:32:08 — 25/05/2026', 11, { color: { r: 1, g: 1, b: 1 }, opacity: 0.7 }));
  hero.appendChild(meta);
  frame.appendChild(hero);

  const kpiSection = autoFrame('KPI Row', 'HORIZONTAL', { gap: 12, px: 24, py: 18, fill: solid(C.bgSec), w: 960 });
  kpiSection.strokes = stroke(C.border);
  kpiSection.strokeWeight = 0.5;
  const kpis = [
    { label: 'Dân cư đang hoạt động', value: '42.318', delta: '▲ 2.4%', color: C.blue },
    { label: 'Lưu lượng giao thông', value: '1.247 xe/h', delta: '● Bình thường', color: C.green },
    { label: 'Chỉ số AQI', value: '68 — TB', delta: '▼ 5 điểm', color: C.orange },
    { label: 'Cảnh báo đang mở', value: '7', delta: '2 ưu tiên cao', color: C.red },
  ];
  kpis.forEach(k => {
    const card = autoFrame(`KPI / ${k.label}`, 'VERTICAL', { gap: 4, px: 14, py: 12, fill: solid(C.bg), radius: 8, layoutAlign: 'STRETCH' });
    card.layoutGrow = 1;
    const accent = rect(3, card.height, k.color);
    card.appendChild(accent);
    card.appendChild(text(k.label, 11, { color: C.textSec }));
    card.appendChild(text(k.value, 20, { bold: true }));
    card.appendChild(text(k.delta, 10, { color: C.textSec }));
    kpiSection.appendChild(card);
  });
  frame.appendChild(kpiSection);

  const modules = autoFrame('Modules', 'VERTICAL', { gap: 14, px: 24, py: 20, w: 960 });
  const modHeader = autoFrame('SectionHeader', 'HORIZONTAL', { align: 'SPACE_BETWEEN', w: 912 });
  const modTitle = autoFrame('Titles', 'VERTICAL', { gap: 4 });
  modTitle.appendChild(text('Phân khu điều hành', 15, { bold: true }));
  modTitle.appendChild(text('Truy cập nhanh các phân hệ giám sát chuyên sâu', 11, { color: C.textSec }));
  modHeader.appendChild(modTitle);
  modHeader.appendChild(text('Xem tất cả →', 11, { color: C.textInfo }));
  modules.appendChild(modHeader);

  const grid = autoFrame('ModuleGrid', 'HORIZONTAL', { gap: 12, w: 912 });
  grid.layoutWrap = 'WRAP';
  const moduleData = [
    { name: 'Giao thông', meta: '128 camera • 64 đèn', target: 'traffic', icon: '🚦' },
    { name: 'An ninh — Cứu hộ', meta: '96 camera AI', target: 'security', icon: '🛡' },
    { name: 'Môi trường', meta: '42 trạm quan trắc', target: 'environment', icon: '🌿' },
    { name: 'Năng lượng', meta: '3.840 đèn LED', target: 'utilities', icon: '⚡' },
    { name: 'Cấp thoát nước', meta: '24 trạm bơm', target: 'utilities', icon: '💧' },
    { name: 'Dịch vụ cư dân', meta: 'Phản ánh • Tổng đài', target: 'utilities', icon: '🎧' },
  ];
  moduleData.forEach(m => {
    const card = autoFrame(`Module / ${m.name}`, 'VERTICAL', { gap: 8, px: 14, py: 14, fill: solid(C.bg), radius: 8, stroke: C.border, w: 290 });
    card.name = `Module / ${m.name} → ${m.target}`;
    const top = autoFrame('Top', 'HORIZONTAL', { align: 'SPACE_BETWEEN', w: 262 });
    top.appendChild(text(m.icon, 16));
    top.appendChild(text('ONLINE', 9, { color: C.green }));
    card.appendChild(top);
    card.appendChild(text(m.name, 13, { bold: true }));
    card.appendChild(text(m.meta, 10, { color: C.textSec }));
    card.appendChild(text('Mở bảng điều khiển →', 10, { color: C.textInfo }));
    grid.appendChild(card);
  });
  modules.appendChild(grid);
  frame.appendChild(modules);

  const footer = autoFrame('Footer', 'HORIZONTAL', { align: 'SPACE_BETWEEN', px: 24, py: 16, fill: solid(C.bgSec), w: 960 });
  footer.strokes = stroke(C.border);
  footer.strokeWeight = 0.5;
  const stats = autoFrame('Stats', 'HORIZONTAL', { gap: 14 });
  ['Máy chủ: 12/12', 'Dữ liệu: đồng bộ', 'Bảo mật: ổn định'].forEach(s => stats.appendChild(text(s, 11, { color: C.textSec })));
  footer.appendChild(stats);
  footer.appendChild(text('v3.2.1 — © Smart City IOC 2026', 11, { color: C.textSec }));
  frame.appendChild(footer);

  return frame;
}

function buildTrafficFrame(headerComp) {
  const frame = autoFrame('02 — Giao thông / Realtime', 'VERTICAL', { gap: 0, w: 960, fill: solid(C.bg) });
  addHeader(frame, headerComp);

  const toolbar = autoFrame('Toolbar', 'HORIZONTAL', { align: 'SPACE_BETWEEN', px: 20, py: 12, w: 960, stroke: C.border });
  toolbar.strokes = stroke(C.border);
  toolbar.strokeWeight = 0.5;
  const left = autoFrame('Left', 'HORIZONTAL', { gap: 14, counterAlign: 'CENTER' });
  left.appendChild(text('Bảng điều hành thời gian thực', 14, { bold: true }));
  const tabs = autoFrame('TimeTabs', 'HORIZONTAL', { gap: 4 });
  ['Trực tiếp', '24h', '7 ngày', 'Tháng'].forEach((t, i) => {
    const tab = autoFrame(t, 'HORIZONTAL', { px: 10, py: 3, radius: 4, fill: i === 0 ? solid(C.bgInfo) : [] });
    tab.appendChild(text(t, 11, { bold: i === 0, color: i === 0 ? C.textInfo : C.textSec }));
    tabs.appendChild(tab);
  });
  left.appendChild(tabs);
  toolbar.appendChild(left);
  const status = autoFrame('Status', 'HORIZONTAL', { gap: 8, counterAlign: 'CENTER' });
  status.appendChild(circle(6, C.green));
  status.appendChild(text('Cập nhật mỗi 5 giây', 11, { color: C.textSec }));
  toolbar.appendChild(status);
  frame.appendChild(toolbar);

  const body = autoFrame('Body', 'HORIZONTAL', { gap: 0, w: 960 });
  const mapCol = autoFrame('MapCol', 'VERTICAL', { gap: 12, px: 20, py: 16, layoutAlign: 'STRETCH' });
  mapCol.layoutGrow = 1.4;
  mapCol.strokes = stroke(C.border);
  mapCol.strokeWeight = 0.5;
  mapCol.appendChild(text('Bản đồ giám sát đô thị', 12, { bold: true }));
  const map = autoFrame('Map', 'VERTICAL', { w: 520, h: 280, fill: solid(C.navy), radius: 8 });
  map.appendChild(text('Smart City — Khu vực trung tâm', 9, { color: { r: 0.71, g: 0.831, b: 0.957 }, opacity: 0.7 }));
  mapCol.appendChild(map);
  const miniStats = autoFrame('MiniStats', 'HORIZONTAL', { gap: 8, w: 520 });
  [
    { l: 'Camera trực tuyến', v: '224/230' },
    { l: 'Cảm biến IoT', v: '1.842' },
    { l: 'Sự cố hôm nay', v: '14' },
  ].forEach(s => {
    const ms = autoFrame(s.l, 'VERTICAL', { gap: 2, px: 10, py: 8, fill: solid(C.bgSec), radius: 8, layoutAlign: 'STRETCH' });
    ms.layoutGrow = 1;
    ms.appendChild(text(s.l, 10, { color: C.textSec }));
    ms.appendChild(text(s.v, 16, { bold: true, color: s.l.includes('Sự cố') ? C.textDanger : C.text }));
    miniStats.appendChild(ms);
  });
  mapCol.appendChild(miniStats);
  body.appendChild(mapCol);

  const alertCol = autoFrame('AlertCol', 'VERTICAL', { gap: 8, px: 20, py: 16, layoutAlign: 'STRETCH' });
  alertCol.layoutGrow = 1;
  alertCol.appendChild(text('Dòng cảnh báo', 12, { bold: true }));
  const alerts = [
    { tag: 'KHẨN CẤP', title: 'Va chạm giao thông — Ngã tư A4', time: '2 phút', color: C.red },
    { tag: 'CẢNH BÁO', title: 'AQI vượt ngưỡng — Trạm B2', time: '8 phút', color: C.orange },
    { tag: 'CẢNH BÁO', title: 'Trạm bơm #07 — Áp suất bất thường', time: '15 phút', color: C.orange },
    { tag: 'THÔNG TIN', title: 'Phản ánh cư dân mới', time: '23 phút', color: C.blue },
    { tag: 'XỬ LÝ XONG', title: 'Cây đổ — Khu C — Đã giải tỏa', time: '41 phút', color: C.green },
  ];
  alerts.forEach(a => {
    const card = autoFrame(`Alert / ${a.tag}`, 'VERTICAL', { gap: 4, px: 12, py: 10, fill: solid(C.bg), radius: 8, stroke: C.border });
    const top = autoFrame('Top', 'HORIZONTAL', { align: 'SPACE_BETWEEN', w: 360 });
    top.appendChild(text(a.tag, 9, { bold: true, color: a.color }));
    top.appendChild(text(a.time + ' trước', 9, { color: C.textSec }));
    card.appendChild(top);
    card.appendChild(text(a.title, 12, { bold: true }));
    card.appendChild(text('Chi tiết sự cố...', 10, { color: C.textSec }));
    alertCol.appendChild(card);
  });
  body.appendChild(alertCol);
  frame.appendChild(body);

  const chart = autoFrame('Chart', 'VERTICAL', { gap: 10, px: 20, py: 14, w: 960, stroke: C.border });
  chart.strokes = stroke(C.border);
  chart.strokeWeight = 0.5;
  const ch = autoFrame('ChartHeader', 'HORIZONTAL', { align: 'SPACE_BETWEEN', w: 920 });
  ch.appendChild(text('Lưu lượng giao thông — 24 giờ qua', 12, { bold: true }));
  ch.appendChild(text('Đỉnh: 18:00 — 2.840 xe/h', 10, { color: C.textSec }));
  chart.appendChild(ch);
  chart.appendChild(rect(920, 110, C.bgSec, 4));
  frame.appendChild(chart);

  return frame;
}

function buildPlaceholderFrame(name, title, desc, icon, headerComp) {
  const frame = autoFrame(name, 'VERTICAL', { gap: 0, w: 960, h: 700, fill: solid(C.bg) });
  addHeader(frame, headerComp);
  const content = autoFrame('Content', 'VERTICAL', { gap: 16, counterAlign: 'CENTER', align: 'CENTER', w: 960, layoutGrow: 1 });
  content.appendChild(text(icon, 48, { color: C.textInfo, opacity: 0.4 }));
  content.appendChild(text(title, 18, { bold: true }));
  content.appendChild(text(desc, 13, { color: C.textSec }));
  const btn = autoFrame('BackBtn', 'HORIZONTAL', { gap: 6, px: 16, py: 8, fill: solid(C.textInfo), radius: 6 });
  btn.appendChild(text('← Về Tổng quan', 13, { bold: true, color: { r: 1, g: 1, b: 1 } }));
  btn.name = 'Back → overview';
  content.appendChild(btn);
  frame.appendChild(content);
  return frame;
}

async function linkClick(source, targetId, navigation = 'NAVIGATE') {
  await source.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    action: {
      type: 'NODE',
      destinationId: targetId,
      navigation,
      transition: { type: 'DISSOLVE', duration: 0.2, easing: { type: 'EASE_OUT' } },
    },
  }]);
}

async function setupPrototypeLinks(frames, headerComp) {
  const frameMap = {};
  frames.forEach(f => { frameMap[f.name.split('—')[1]?.trim().split(' ')[0]?.toLowerCase() || f.name] = f; });

  const byId = {};
  frames.forEach(f => {
    if (f.name.includes('Tổng quan')) byId.overview = f;
    if (f.name.includes('Giao thông')) byId.traffic = f;
    if (f.name.includes('An ninh')) byId.security = f;
    if (f.name.includes('Môi trường')) byId.environment = f;
    if (f.name.includes('Tiện ích')) byId.utilities = f;
    if (f.name.includes('Báo cáo')) byId.reports = f;
  });

  // Link module cards on overview
  const overview = byId.overview;
  if (overview) {
    overview.findAll(n => n.name.startsWith('Module /')).forEach(card => {
      const targetKey = card.name.split('→')[1]?.trim();
      if (targetKey && byId[targetKey]) linkClick(card, byId[targetKey].id);
    });
  }

  // Link back buttons
  ['security', 'environment', 'utilities', 'reports'].forEach(key => {
    const f = byId[key];
    if (f) {
      const back = f.findOne(n => n.name === 'Back → overview');
      if (back && byId.overview) linkClick(back, byId.overview.id);
    }
  });

  // Link nav items in each frame header
  const navTargets = {
    'Tổng quan': byId.overview,
    'Giao thông': byId.traffic,
    'An ninh': byId.security,
    'Môi trường': byId.environment,
    'Tiện ích': byId.utilities,
    'Báo cáo': byId.reports,
  };

  frames.forEach(frame => {
    const headerInst = frame.findOne(n => n.type === 'INSTANCE' && n.name.includes('Header'));
    if (!headerInst) return;
    headerInst.findAll(n => n.name.startsWith('Nav /')).forEach(navItem => {
      const label = navItem.name.replace('Nav / ', '');
      const target = navTargets[label];
      if (target) linkClick(navItem, target.id);
    });
    const brand = headerInst.findOne(n => n.name === 'Brand');
    if (brand && byId.overview) linkClick(brand, byId.overview.id);
  });
}

async function main() {
  await loadFont();

  const page = figma.currentPage;
  page.name = 'IOC Smart City Prototype';

  // Components page section
  const compSection = autoFrame('🧩 Components', 'HORIZONTAL', { gap: 40, px: 40, py: 40, fill: [] });
  const navComp = buildNavComponent();
  const headerComp = buildHeaderComponent(navComp);
  compSection.appendChild(navComp);
  compSection.appendChild(headerComp);
  compSection.x = 0;
  compSection.y = -400;
  page.appendChild(compSection);

  const frames = [];
  const startY = 0;
  const gap = 80;

  frames.push(buildOverviewFrame(headerComp));
  frames.push(buildTrafficFrame(headerComp));
  frames.push(buildPlaceholderFrame('03 — An ninh', 'An ninh — Cứu hộ', '96 camera AI • 12 đội ứng phó', '🛡', headerComp));
  frames.push(buildPlaceholderFrame('04 — Môi trường', 'Môi trường', '42 trạm quan trắc • AQI, nước, ồn', '🌿', headerComp));
  frames.push(buildPlaceholderFrame('05 — Tiện ích', 'Tiện ích đô thị', 'Năng lượng, chiếu sáng, cấp thoát nước', '⚡', headerComp));
  frames.push(buildPlaceholderFrame('06 — Báo cáo', 'Báo cáo & Phân tích', 'Báo cáo định kỳ và xuất dữ liệu', '📊', headerComp));

  frames.forEach((f, i) => {
    f.x = i * (960 + gap);
    f.y = startY;
    page.appendChild(f);
  });

  await setupPrototypeLinks(frames, headerComp);

  figma.currentPage.flowStartingPoints = [{ nodeId: frames[0].id, name: 'Start' }];
  figma.viewport.scrollAndZoomIntoView([...frames, compSection]);

  figma.notify('✅ IOC Prototype built: 6 frames, Header + Nav components, click interactions linked. Press Present (▶) to test.');
  figma.closePlugin();
}

main().catch(err => {
  figma.notify('Error: ' + err.message, { error: true });
  figma.closePlugin();
});
