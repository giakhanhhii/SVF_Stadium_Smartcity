**Tác giả:** Nguyễn Triệu Gia Khánh

# Nghiên cứu & thiết kế giao diện — IOC Smart City & Sân vận động PVF

> Tài liệu tổng hợp quá trình nghiên cứu, phân tích và triển khai giao diện **hai Trung tâm Điều hành (IOC)** trong hệ sinh thái Vinsmartcity: **IOC Smart City** (đô thị thông minh) và **IOC Sân vận động PVF** (vận hành sự kiện / venue). Hai prototype dùng chung lớp `shared-ioc/`, cross-link qua header, nhưng **khác domain nav, accent màu và pattern layout** (Smart City có thêm Command Center 3D trên Giao thông & An ninh).

**Ngày cập nhật:** 25/05/2026 (Tách Smart City / PVF, đồng bộ Command Center + Three.js)

**Deliverables trong repo:**

| File / thư mục | Vai trò |
|----------------|---------|
| `ioc_smartcity_homepage_mockup.html` | Mockup tĩnh trang Tổng quan Smart City (nguồn thiết kế) |
| `ioc_realtime_dashboard.html` | Mockup tĩnh Giao thông / Realtime (nguồn thiết kế — **layout cũ**, tham chiếu lịch sử) |
| `smartcity-ioc/` | **Prototype IOC Smart City** — 6 trang, ES modules |
| `stadium-ioc/` | **Prototype IOC Sân vận động PVF** — 6 trang venue, cùng pattern modular |
| `shared-ioc/` | CSS base, router, bootstrap, render helpers dùng chung |
| `scripts/dev-server.mjs` | Dev server Node, port 3457, serve từ root repo |
| `scripts/ioc-smoke-test.mjs` | Smoke test headless (dump DOM) |
| `figma-ioc-prototype/` | Plugin Figma — frames & interactions |
| `plan.md` | Kế hoạch refactor god file → modular (Phase 0–7) |
| `NguyenTrieuGiaKhanh_KE_HOACH_TRIEN_KHAI.md` | Kế hoạch triển khai 6 tuần (PVF → Smart City) |

**Bộ tài liệu sản phẩm (chuẩn):** BRD · SRS · Tài liệu kiến trúc · Nghiên cứu UI (tài liệu này) · Mockup · Prototype · Báo cáo tiến độ · UAT — chi tiết xem `NguyenTrieuGiaKhanh_KE_HOACH_TRIEN_KHAI.md` mục 9.

**Note:** Hệ thống **PVF** cần **tích hợp VOC (Venue Operations Centre)** theo **tiêu chuẩn vận hành venue FIFA** — prototype hiện tại mô phỏng khung VOC trên giao diện; tích hợp backend VOC thật mô tả trong BRD/SRS & kiến trúc (giai đoạn sau prototype).

**URL demo (dev server):**

```
http://localhost:3457/smartcity-ioc/index.html   ← IOC Smart City
http://localhost:3457/stadium-ioc/index.html     ← IOC Sân vận động PVF
```

---

## Phần I — Nền tảng chung (Dual IOC)

### I.1 IOC trong bối cảnh Smart City & Venue

Theo chuẩn tham chiếu **IEC SRD 63302-1:2025** (Intelligent Operations Centre), trung tâm điều hành là lớp **tích hợp liên miền** — gom dữ liệu đô thị / venue vào **single pane of glass**, hỗ trợ giám sát thời gian thực và phối hợp liên ban ngành.

**Quan điểm thiết kế:** UI phục vụ chuỗi *nhận biết tình huống → ưu tiên → hành động → theo dõi kết quả*. Màu, alert, bản đồ/scene đều gắn severity và domain — không trang trí.

Trong dự án Vinsmartcity, **hai IOC** phục vụ hai phạm vi:

| IOC | Phạm vi | Người dùng mục tiêu |
|-----|---------|---------------------|
| **Smart City** | Giao thông, an ninh đô thị, môi trường, tiện ích, báo cáo tổng hợp | Ban quản lý đô thị, trung tâm điều hành thành phố |
| **Sân vận động PVF** | An ninh venue, sự kiện/trận đấu, hạ tầng sân, dịch vụ khán giả, báo cáo vận hành | Ban tổ chức, an ninh sân, vận hành sự kiện |

### I.2 Kiến trúc repo & luồng cross-link

```
                         ┌─────────────────────────┐
                         │     shared-ioc/         │
                         │  CSS · router · render  │
                         └───────────┬─────────────┘
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌────────────────────┐         ┌────────────────────────┐
         │   smartcity-ioc/   │◄───────►│     stadium-ioc/       │
         │   IOC Smart City   │ center- │  IOC Sân vận động PVF  │
         │   accent #185FA5   │ switch  │  accent #0F6E56        │
         └────────────────────┘         └────────────────────────┘
```

- Header **center-switch**: Smart City ↔ PVF (icon + label)
- Module card **Sân vận động** trên overview Smart City → deep link `stadium-ioc/`

**Luồng boot (cả hai IOC):**

```
index.html → app.js → bootstrap.createApp()
  → fetch partials/shell/header.html
  → fetch partials/pages/*.html
  → hydrateAllPages() (render từ data/*.js)
  → bindRouter(onNavigate: …)
```

**Smart City bổ sung trên navigate:**

```
onNavigate → initPageScenes(pageId)   // Three.js — traffic, security
           → initPageCharts(pageId)   // Chart.js — environment, reports
```

**Lưu ý vận hành:** Serve HTTP từ **root repo** (`node scripts/dev-server.mjs`). Không mở `file://` — path `../shared-ioc/` và ES module imports phụ thuộc URL gốc.

### I.3 Nghiên cứu tham khảo (áp dụng chung)

| Nguồn | Insight | Áp dụng |
|-------|---------|---------|
| MDPI — Geospatial Dashboards | Row-column / menu-theme / filter-driven layouts | Overview = row-column; nav domain = menu-theme; time tabs = filter-driven |
| Smashing Magazine — Real-Time Dashboards | Visual hierarchy, màu semantic, alert có ngữ cảnh, độ tươi dữ liệu | Badge KHẨN CẤP/CẢNH BÁO; timestamp + mô tả hành động trên alert |
| Aldar Command Center case study | Map/scene 3D + trạng thái động, tách workflow domain | **Smart City** Giao thông/An ninh: Command Center 3D |
| Figma Auto Layout & State management | Nested auto-layout, component Header/Nav tái sử dụng | Plugin `figma-ioc-prototype/` |

### I.4 Design system dùng chung

**Base tokens** (`shared-ioc/assets/css/tokens-base.css`):

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--color-text-info` | `#185FA5` | Link, chart, accent Smart City |
| `--color-text-danger` | `#A32D2D` | Sự cố, KPI cảnh báo |
| `--color-text-success` | `#0F6E56` | Xu hướng tích cực, accent PVF |
| `--color-text-warning` | `#854F0B` | Cảnh báo vàng |

**Typography & spacing:** Font hệ thống; scale 9–11px meta → 12–15px section → 20–28px KPI/hero; border `0.5px`, radius 8–12px; padding `clamp(20px, 3vw, 48px)`.

**Iconography:** Tabler Icons (`@tabler/icons-webfont`) — outline thống nhất cho ops UI.

**Quy ước kích thước file** (`.cursor/rules/ioc-no-god-component.mdc`): partial HTML ~150 dòng · JS module ~100 dòng · CSS component ~80 dòng.

---

## Phần II — IOC Smart City

### II.1 Mục tiêu & nguồn thiết kế

**Trả lời câu hỏi vận hành:** *“Thành phố / khu đô thị đang ở trạng thái nào, chuyện gì đang xảy ra ở từng phân hệ?”*

| Mockup nguồn | Vai trò | Trạng thái trong prototype |
|--------------|---------|----------------------------|
| `ioc_smartcity_homepage_mockup.html` | Tổng quan — hero, vitals, KPI, module cards | ✅ Giữ pattern trên tab **Tổng quan** |
| `ioc_realtime_dashboard.html` | Giao thông — map + alert stream + chart | ⚠️ **Chỉ còn tham chiếu lịch sử**; tab Giao thông đã nâng cấp Command Center 3D |

### II.2 Hai pattern layout trong Smart City

Prototype Smart City dùng **hai pattern song song**:

#### A. Ops console (classic) — 4 tab

Shell sáng, `max-width: 1280px` (trừ khi bật wall mode tương lai).

**Pattern:** `DomainBanner → DomainKpiRow → DashBody (map-col | alerts-col) → ChartSection`

| Tab | Page ID | Nội dung UI | Chart.js |
|-----|---------|-------------|----------|
| **Tổng quan** | `overview` | Hero SVG + vitals + KPI grid + 7 module cards (gồm link PVF) + footer | — |
| **Môi trường** | `environment` | Banner → KPI → SVG AQI heatmap + station list | `envChart` ✅ |
| **Tiện ích** | `utilities` | Banner → KPI → panels điện/nước/đèn (inline partial) | — |
| **Báo cáo** | `reports` | Banner + time tabs → KPI → sidebar categories + table | `reportsChart` ✅ |

#### B. Command Center 3D (dark HUD) — 2 tab

Shell **full-width** khi active (`security-command.css` override `max-width: 100%`).

**Pattern:** `HUD trái (~250px) | Scene 3D hero | HUD phải (~280px)`

```
┌──────────────┬─────────────────────────────┬──────────────┐
│  Sidebar trái│      Three.js scene         │ Sidebar phải │
│  stats/camera│   OrbitControls · legend    │ alerts/chart │
│  flow/incident │   nước · bóng · animation   │ signal/env   │
└──────────────┴─────────────────────────────┴──────────────┘
```

| Tab | Page ID | Scene 3D | HUD nội dung (mock) |
|-----|---------|----------|---------------------|
| **An ninh** | `security` | 5 tòa nhà, nước phản chiếu, mái xanh, camera pins, markers sự cố | Trái: nhân sự, camera, blacklist · Phải: môi trường, thiết bị, năng lượng |
| **Giao thông** | `traffic` | Ngã tư 4 hướng, xe/ xe máy animation, đèn tín hiệu, vạch kẻ | Trái: lưu lượng, camera ngã tư, sự cố · Phải: điều khiển đèn, ùn tắc, biểu đồ 24h (SVG inline) |

**File chính:**

| Layer | Đường dẫn |
|-------|-----------|
| Layout CSS | `smartcity-ioc/assets/css/security-command.css` |
| Scene registry | `smartcity-ioc/assets/js/scene/index.js` |
| An ninh 3D | `scene/security-building-scene.js`, `scene-buildings.js`, `scene-environment.js` |
| Giao thông 3D | `scene/traffic-road-scene.js`, `traffic-street.js`, `traffic-vehicles.js` |
| HUD render | `render/security-panels-*.js`, `render/traffic-panels-*.js` |
| Mock data | `data/security.js`, `data/traffic.js`, `data/building-scene.js`, `data/traffic-scene.js` |

**Three.js:** r0.164.1 qua import map CDN trong `smartcity-ioc/index.html`. Lazy init + dispose WebGL khi chuyển tab (`sceneRegistry`).

> **Lưu ý:** `assets/js/charts/traffic-chart.js` và `#trafficChart` là **legacy** — không còn canvas trên trang Giao thông; trend hiển thị qua SVG mini-chart trong HUD phải.

### II.3 Design tokens Smart City

`smartcity-ioc/assets/css/tokens.css`:

| Token | Giá trị |
|-------|---------|
| `--smartcity-accent` / `--ioc-accent` | `#185FA5` |
| `--ioc-accent-light` | `#E6F1FB` |
| `--ioc-nav-active` | `#1D9E75` |
| `--ioc-hero-bg` | Gradient `#042C53 → #378ADD` |
| `--ioc-map-bg` | `#042C53` |

Nav 6 mục: Tổng quan · Giao thông · An ninh · Môi trường · Tiện ích · Báo cáo.

### II.4 Sơ đồ điều hướng Smart City

```
                    ┌─────────────────┐
                    │ 01 — Tổng quan  │
                    └────────┬────────┘
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                    ▼
  ┌─────────────┐    ┌─────────────┐      ┌──────────────┐
  │ Giao thông  │    │ An ninh     │      │ Môi trường … │
  │ Command 3D  │    │ Command 3D  │      │ Ops classic  │
  └─────────────┘    └─────────────┘      └──────────────┘
         │                                        │
         └──────────── center-switch ─────────────┼──► stadium-ioc/ (PVF)
```

### II.5 Checklist Smart City

| Hạng mục | Trạng thái |
|----------|------------|
| 6 tab đầy đủ mock data | ✅ |
| Tổng quan / Môi trường / Tiện ích / Báo cáo — ops classic | ✅ |
| Giao thông / An ninh — Command Center 3D | ✅ |
| Chart.js environment + reports | ✅ |
| Chart.js traffic | ❌ Legacy (không dùng) |
| Click camera 3D ↔ video sidebar | ⏳ Chưa làm |
| Wall mode full ultrawide | ⏳ Chưa làm |
| API / WebSocket realtime | ⏳ Mock tĩnh |

---

## Phần III — IOC Sân vận động PVF

### III.1 Mục tiêu & bối cảnh venue

**IOC Sân vận động PVF** (PVF — venue trong hệ sinh thái Vinsmartcity) phục vụ **vận hành sự kiện / trận đấu** tại sân vận động: an ninh đám đông, timeline sự kiện, hạ tầng kỹ thuật sân, dịch vụ khán giả.

**Trả lời câu hỏi vận hành:** *“Trận / sự kiện đang diễn ra thế nào? Mật độ khán giả, camera, hạ tầng sân có ổn không?”*

Không có mockup HTML riêng ban đầu — PVF được thiết kế **cùng pattern modular** với Smart City (refactor `stadium-ioc/` trước trong `plan.md` Phase 1–6), accent xanh lá venue, nav và mock data theo domain sân vận động.

### III.1b Tích hợp VOC — tiêu chuẩn FIFA

**VOC (Venue Operations Centre)** là mô hình trung tâm điều phối tập trung trong ngày thi đấu / sự kiện, phù hợp khung vận hành venue của **FIFA**. IOC PVF trong dự án đóng vai trò **lớp giao diện VOC** — hiển thị và điều phối thông tin, chưa thay thế toàn bộ hệ thống backend.

| Khối VOC (FIFA venue ops) | Màn hình IOC PVF |
|---------------------------|------------------|
| An ninh & quản lý đám đông | An ninh |
| Vận hành sự kiện / trận đấu | Sự kiện · Tổng quan |
| Hạ tầng kỹ thuật (điện, HVAC…) | Cơ sở hạ tầng |
| Dịch vụ khán giả | Dịch vụ |
| Báo cáo & KPI vận hành | Báo cáo |

**Ranh giới giai đoạn:** Prototype = mock data + luồng UI VOC. Production = nối API camera, BMS, ticketing, SCADA theo **SRS** và **tài liệu kiến trúc**.

### III.2 Pattern layout — Ops console (toàn bộ 6 tab)

PVF **không dùng Command Center 3D** — tất cả tab theo pattern classic:

**Pattern:** `DomainBanner → DomainKpiRow → DashBody (map / video | alerts) → Chart / Timeline`

| Tab | Page ID | Pattern UI | Chart.js |
|-----|---------|------------|----------|
| **Tổng quan** | `overview` | Hero sân ellipse + vitals + KPI + module cards + footer | — |
| **An ninh** | `security` | Banner → KPI → **Video wall 4 tile** + SVG sơ đồ sân (mật độ đám đông) + severity + alerts | — |
| **Sự kiện** | `events` | Banner → KPI → SVG event map + timeline + mini stats | `eventsChart` ✅ |
| **Cơ sở hạ tầng** | `facilities` | Banner → KPI → utility panels (điện, HVAC, nước…) + alerts | — |
| **Dịch vụ** | `services` | Banner → KPI → mini stats + alerts (F&B, parking, VIP…) | — |
| **Báo cáo** | `reports` | Banner → categories sidebar + KPI table + bar chart | `reportsChart` ✅ |

**Đặc thù UX PVF so với Smart City:**

| Khía cạnh | PVF | Smart City (classic tabs) |
|-----------|-----|---------------------------|
| Hero | Ellipse sân cỏ, badge “Trận đang diễn ra” | Gradient đô thị + pattern mạng lưới |
| An ninh | Video wall + GIS sân (khán đài, mật độ) | Smart City An ninh = **3D tòa nhà** (khác hẳn) |
| Domain nav | Sự kiện, Cơ sở hạ tầng, Dịch vụ | Giao thông, Môi trường, Tiện ích |
| Accent | Xanh lá `#0F6E56` | Xanh dương `#185FA5` |
| Three.js | Không | Có (Giao thông + An ninh) |

### III.3 Design tokens PVF

`stadium-ioc/assets/css/tokens.css`:

| Token | Giá trị |
|-------|---------|
| `--stadium-accent` / `--ioc-accent` | `#0F6E56` |
| `--ioc-accent-light` | `#E1F5EE` |
| `--ioc-nav-active` | `#0F6E56` |
| `--ioc-hero-bg` | Gradient `#0a3d2e → #1D9E75` |
| `--ioc-map-bg` | `#0a3d2e` |

Header: **IOC Sân vận động** · subtitle *Trung tâm điều hành sự kiện* · avatar `SV` · center-switch về Smart City.

Nav 6 mục: Tổng quan · An ninh · Sự kiện · Cơ sở hạ tầng · Dịch vụ · Báo cáo.

### III.4 Cấu trúc file PVF

```
stadium-ioc/
├── index.html
├── assets/css/tokens.css
├── assets/js/
│   ├── app.js
│   ├── pages/init.js          # hydrate — chỉ shared render
│   ├── data/*.js              # overview, security, events, …
│   └── charts/                # events-chart, reports-chart
└── partials/
    ├── shell/header.html
    └── pages/*.html
```

Mock data venue: mật độ khán giả, camera sân (CAM-S1…), trận Vòng 12, KPI hạ tầng sân.

### III.5 Sơ đồ điều hướng PVF

```
                    ┌─────────────────┐
                    │ 01 — Tổng quan  │
                    │  (Venue hero)   │
                    └────────┬────────┘
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                    ▼
  ┌─────────────┐    ┌─────────────┐      ┌──────────────┐
  │ An ninh     │    │ Sự kiện     │      │ Cơ sở HT …   │
  │ Video+GIS   │    │ Timeline    │      │ Ops classic  │
  └─────────────┘    └─────────────┘      └──────────────┘
         │
         └──────────── center-switch ───────────────► smartcity-ioc/
```

### III.6 Checklist PVF

| Hạng mục | Trạng thái |
|----------|------------|
| 6 tab đầy đủ mock data | ✅ |
| Ops classic layout toàn bộ tab | ✅ |
| Chart.js events + reports | ✅ |
| Command Center / Three.js | ⏳ Chưa (tùy chọn parity Smart City — tuần 5+) |
| Branding PVF trên header/mock data | ⚠️ Cần bổ sung tên PVF vào header nếu stakeholder yêu cầu |
| Tích hợp VOC backend (FIFA venue ops) | ⏳ Sau prototype — theo BRD/SRS & kiến trúc |
| Unified incident Smart City ↔ PVF | ⏳ Chưa (đề xuất §V.3) |

---

## Phần IV — So sánh hai IOC

| Tiêu chí | IOC Smart City | IOC Sân vận động PVF |
|----------|----------------|------------------------|
| **Phạm vi** | Đô thị / khu thông minh | Venue / trận đấu / sự kiện |
| **Số tab** | 6 | 6 |
| **Accent** | `#185FA5` (xanh dương) | `#0F6E56` (xanh lá) |
| **Layout chính** | Hybrid: classic + **Command 3D** | **100% ops classic** |
| **Three.js** | Giao thông, An ninh | Không |
| **Video wall** | Thumbnail HUD (An ninh SC) | Video wall 4 tile (An ninh PVF) |
| **Chart.js tabs** | environment, reports | events, reports |
| **Cross-link** | Module card + center-switch | center-switch về Smart City |
| **Shared layer** | `shared-ioc/` CSS + router + render | Cùng |

---

## Phần V — Hạn chế, roadmap & tài liệu tham khảo

### V.1 Hạn chế hiện tại (cả hai IOC)

- **Dữ liệu tĩnh** — chưa WebSocket/API; VOC backend chưa nối
- **Tài liệu BRD / SRS / Kiến trúc** — cần bổ sung song song prototype (xem kế hoạch triển khai mục 9)
- **Map/scene** — Smart City 3D = Three.js mock; PVF + tab classic = SVG minh họa; production cần Mapbox/Leaflet hoặc GIS thật
- **Shell max-width 1280px** — classic tabs; Command Center SC đã full-width; wall mode chưa có token `.wall-mode`
- **Dev tooling** — có `dev-server.mjs` + smoke test; **chưa** `package.json` / `npm run dev` / Playwright CI
- **Accessibility** — chưa audit WCAG đầy đủ
- **Figma plugin** — chưa sync Command Center 3D và frame PVF riêng
- **Partial components HTML** — render qua JS templates; chưa tách `partials/components/` (plan Phase 2)

### V.2 Giai đoạn triển khai

| Giai đoạn | Nội dung | Trạng thái |
|-----------|----------|------------|
| **1** | Ghép mockup, god file, Figma plugin v1 | ✅ |
| **2** | Modular dual IOC (`shared-ioc`, stadium trước, smartcity sau) | ✅ |
| **3** | Smart City Command Center + Three.js (Giao thông, An ninh) | ✅ |
| **4** | PVF branding, wall mode, 3D tùy chọn PVF, API realtime | ⏳ Roadmap |

### V.3 Roadmap ưu tiên

```
P0  Dev server document + smoke test mở rộng (12 tab)
P1  Verify nav Smart City 6 + PVF 6 + center-switch
P2  Smart City: click camera 3D ↔ HUD; traffic signal sync
P3  PVF: branding header “PVF”; Figma frame venue
P4  Wall mode + design tokens JSON
P5  PVF Command Center 3D (optional parity)
P6  API adapter + unified incident SC ↔ PVF
```

### V.4 Tài liệu tham khảo

1. IEC SRD 63302-1:2025 — Intelligent Operations Centre for Smart Cities  
   https://webstore.iec.ch/en/publication/74175

2. Karampakakis et al. — *Geospatial Dashboards for Monitoring Smart City Performance* (MDPI)  
   https://www.mdpi.com/2071-1050/11/20/5648

3. Smashing Magazine — *UX Strategies For Real-Time Dashboards* (2025)  
   https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/

4. Hasaruwan — *Aldar Command Center*  
   https://hasaruwan.com/projects/aldar-command-center/

5. Figma Help — *Guide to auto layout* · *State management for prototypes*

6. Kế hoạch refactor — `plan.md`

---

## Phụ lục — Cây repo v3

```
Vinsmartcity/
├── shared-ioc/
│   ├── assets/css/          # tokens-base, layout, components/*
│   └── assets/js/           # bootstrap, router, render/*
├── smartcity-ioc/
│   ├── index.html
│   ├── assets/css/
│   │   ├── tokens.css
│   │   └── security-command.css    # Command Center layout
│   ├── assets/js/
│   │   ├── app.js                  # charts + scenes on navigate
│   │   ├── pages/init.js
│   │   ├── data/*.js
│   │   ├── charts/                 # env, reports (+ traffic legacy)
│   │   ├── scene/                  # Three.js
│   │   └── render/*-panels-*.js    # HUD sidebars
│   └── partials/
├── stadium-ioc/                      # IOC Sân vận động PVF
│   ├── assets/css/tokens.css
│   ├── assets/js/data/*.js
│   └── partials/pages/*.html
├── scripts/
│   ├── dev-server.mjs
│   └── ioc-smoke-test.mjs
├── plan.md
└── IOC_SMARTCITY_UI_RESEARCH.md      # tài liệu này
```

**Tiêu chí “xong” giai đoạn tiếp theo:** Một lệnh dev server + URL rõ ràng; smoke test 12 tab; tài liệu này khớp repo; stakeholder demo được cả **Smart City Command 3D** và **PVF ops classic**.
