# Plan tách God Component — IOC Prototypes

> Kế hoạch refactor `stadium-ioc/index.html` (~1037 dòng) và `smartcity-ioc/index.html` (từ `ioc_smartcity_prototype.html`, ~1606 dòng).

**Ngày:** 25/05/2026  
**Mục tiêu:** Giữ logic prototype (nav, chart lazy init, mock data) nhưng tách file để Apply Intelligent không gom lại thành god file.

---

## 1. Chẩn đoán hiện trạng

### God file

| File | Dòng | Vấn đề |
|------|------|--------|
| `stadium-ioc/index.html` | ~1037 | CSS + 6 page-view + JS trong 1 file |
| `ioc_smartcity_prototype.html` | ~1606 | Cùng pattern, scale lớn hơn — sẽ chuyển vào `smartcity-ioc/` |

### Block cần tách trong `stadium-ioc/index.html`

| Block | Dòng (ước lượng) | Trách nhiệm |
|-------|------------------|-------------|
| `<style>` | 9–439 | Token, layout, component styles, responsive |
| App shell | 445–484 | Header + nav |
| `#page-overview` | 487–614 | Hero, vitals, KPI, modules, footer |
| `#page-security` | 617–700 | Domain dashboard (video, map, alerts) |
| `#page-events` | 703–773 | Domain + timeline + chart |
| `#page-facilities` | 776–849 | Domain + utility panels |
| `#page-services` | 852–912 | Domain + map + alerts |
| `#page-reports` | 915–952 | Sidebar + table + chart |
| `<script>` | 956–1034 | Router + chart init + tab UI |

### Pattern lặp (4 trang domain)

```
DomainBanner → DomainKpiRow → DashBody(map-col | alerts-col) → [ChartSection]
```

Markup `alert-card`, `domain-kpi`, `map-container` bị copy — cần partial + data.

---

## 2. Cấu trúc thư mục đích

`plan.md` nằm ở **root repo** — không đặt trong từng prototype folder.

```
Projects/
├── shared-ioc/                   # Phase 7 — CSS + router + shell dùng chung
│   ├── assets/css/
│   ├── assets/js/
│   └── partials/
├── stadium-ioc/
│   ├── index.html                # shell mỏng (~80 dòng)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── tokens.css        # override --stadium-accent
│   │   │   ├── layout.css
│   │   │   └── components/
│   │   └── js/
│   │       ├── app.js
│   │       ├── router.js         # import từ shared hoặc local override
│   │       ├── charts/
│   │       └── data/
│   └── partials/
│       ├── shell/
│       ├── components/
│       └── pages/
│           ├── overview.html
│           ├── security.html
│           ├── events.html
│           ├── facilities.html
│           ├── services.html
│           └── reports.html
└── smartcity-ioc/
    ├── index.html                # shell mỏng — migrate từ ioc_smartcity_prototype.html
    ├── assets/
    │   ├── css/
    │   │   ├── tokens.css        # override --smartcity-accent
    │   │   ├── layout.css
    │   │   └── components/
    │   └── js/
    │       ├── app.js
    │       ├── router.js
    │       ├── charts/
    │       └── data/
    └── partials/
        ├── shell/
        ├── components/
        └── pages/                # page id theo smart city (overview, traffic, …)
├── plan.md                       # file này
└── IOC_SMARTCITY_UI_RESEARCH.md
```

**Quy ước:**

- Mỗi prototype là **folder độc lập** (`stadium-ioc/`, `smartcity-ioc/`); cùng pattern `assets/` + `partials/`.
- File god cũ `ioc_smartcity_prototype.html` giữ ở root tạm thời cho đến khi `smartcity-ioc/index.html` parity — sau đó có thể xóa hoặc redirect.
- Shared code extract sang `shared-ioc/`; mỗi folder chỉ giữ token, nav items, data và pages riêng.

---

## 3. Phase thực hiện

### Phase 0 — Quy ước

- [x] Tạo Cursor rule `.cursor/rules/ioc-no-god-component.mdc`
- [x] Tạo `plan.md` (root)
- [ ] Xác nhận dev server (Live Server hoặc `npx serve`) load ES modules — cần chạy qua HTTP (fetch + ES modules); mở trực tiếp `file://` sẽ lỗi CORS

### Phase 1 — Tách CSS (rủi ro thấp) — **stadium-ioc trước** ✅

1. `stadium-ioc/assets/css/tokens.css` — `:root` (accent, màu semantic, radius)
2. `stadium-ioc/assets/css/layout.css` — `.prototype-shell`, `.page-view`, media queries
3. Tách từng component class → `assets/css/components/*.css`
4. `index.html` link CSS qua `<link>`, không còn `<style>` block lớn

**Done khi:** không còn `<style>` > 20 dòng trong `stadium-ioc/index.html`. ✅ (index.html ~35 dòng)

### Phase 2 — Shared partials (stadium-ioc) ✅

Ưu tiên theo tần suất lặp:

| Partial | Dùng ở | Props / data |
|---------|--------|--------------|
| `domain-banner.html` | 5 trang | `title`, `chips[]` |
| `domain-kpi-row.html` | 5 trang | `kpis[]` |
| `alert-list.html` | 4 trang | `alerts[]` |
| `dash-body.html` | 4 trang | slot trái / phải |
| `chart-section.html` | events, reports | `canvasId`, `title` |

Load bằng `fetch()` + inject, hoặc build nhẹ (Vite) nếu cần. ✅ (`assets/js/render/` + `partials/shell/`)

### Phase 3 — Tách pages (stadium-ioc) ✅

- Mỗi `#page-*` → `partials/pages/<name>.html`
- `index.html` chỉ còn shell + `#app-root` + `<script type="module" src="assets/js/app.js">`
- `app.js`: load shell → load page → bind router ✅

### Phase 4 — Tách JS (stadium-ioc) ✅

| Module | Trách nhiệm |
|--------|-------------|
| `router.js` | `navigateTo`, `data-nav` delegation, active nav |
| `charts/index.js` | `chartRegistry`, lazy init theo pageId |
| `charts/events-chart.js` | Chart.js line — lưu lượng vào sân |
| `charts/reports-chart.js` | Chart.js bar — KPI 4 trận |
| `data/*.js` | Mock KPI, alerts, timeline (không HTML) |

Thay `initPageCharts(pageId)` bằng:

```javascript
export const chartRegistry = {
  events: initEventsChart,
  reports: initReportsChart,
};
```

### Phase 5 — Pilot page: Security (stadium-ioc) ✅

**Lý do chọn `#page-security`:** đủ pattern (video grid, map SVG, alerts) mà chưa phụ thuộc chart phức tạp.

- [x] Tách `partials/pages/security.html`
- [x] Tách `assets/js/data/security.js`
- [ ] Verify nav + render giống bản cũ (cần dev server)

### Phase 6 — Replicate các page còn lại (stadium-ioc) ✅

Thứ tự: `events` → `facilities` → `services` → `reports` → `overview`

Overview để cuối vì layout khác (hero + modules, không phải domain pattern).

### Phase 7 — Extract shared + smartcity-ioc ✅

1. Tạo `shared-ioc/` — CSS base, router, shell partials dùng chung ✅
2. `stadium-ioc/` import shared + override token/nav ✅
3. Tạo `smartcity-ioc/` — copy cấu trúc, migrate nội dung từ `ioc_smartcity_prototype.html` ✅
4. `smartcity-ioc/assets/css/tokens.css` — `--smartcity-accent`, nav items, link Stadium ✅

**Done khi:** cả hai folder có `index.html` < 100 dòng; god file root có thể deprecate. ✅ (`ioc_smartcity_prototype.html` redirect → `smartcity-ioc/`)

---

## 4. Map god block → file đích (stadium-ioc)

| God block hiện tại | File đích |
|--------------------|-----------|
| `:root` + base | `assets/css/tokens.css`, `layout.css` |
| Header + nav | `partials/shell/header.html` |
| `#page-overview` | `partials/pages/overview.html` + `data/overview.js` |
| `#page-security` | `partials/pages/security.html` + `data/security.js` |
| `#page-events` | `partials/pages/events.html` + `charts/events-chart.js` |
| `#page-facilities` | `partials/pages/facilities.html` + `data/facilities.js` |
| `#page-services` | `partials/pages/services.html` + `data/services.js` |
| `#page-reports` | `partials/pages/reports.html` + `charts/reports-chart.js` |
| `navigateTo` + handlers | `assets/js/router.js` |
| `initPageCharts` | `assets/js/charts/index.js` |

Smart City: cùng mapping pattern trong `smartcity-ioc/` (page id và data khác — xem `IOC_SMARTCITY_UI_RESEARCH.md`).

---

## 5. Tiêu chí hoàn thành

### stadium-ioc

- [x] `stadium-ioc/index.html` < 100 dòng (~35 dòng)
- [x] Không file nào > 150 dòng (HTML partial) / 100 dòng (JS) / 80 dòng (CSS component)
- [ ] Click nav + module cards chuyển page đúng (cần verify qua dev server)
- [x] Chart lazy init khi vào Events / Reports (`chartRegistry`)
- [x] Mock data tách khỏi markup inline (`assets/js/data/`)

### smartcity-ioc

- [x] `smartcity-ioc/index.html` < 100 dòng (~35 dòng)
- [x] Nội dung tương đương `ioc_smartcity_prototype.html`
- [x] Dùng `shared-ioc/` cho router/shell/components chung

### Chung

- [x] Cursor rule active khi mở `stadium-ioc/**` hoặc `smartcity-ioc/**` (globs trong rule)

---

## 6. Tham chiếu

- Cursor rule: `.cursor/rules/ioc-no-god-component.mdc`
- Nghiên cứu UI: `IOC_SMARTCITY_UI_RESEARCH.md`
- God file Smart City (legacy): `ioc_smartcity_prototype.html` → migrate sang `smartcity-ioc/`
