# Vinsmartcity — hướng dẫn cho AI agent

Prototype web IOC (trung tâm điều hành) gồm 2 app tĩnh, không build step, chạy bằng `npm run dev`
(port 3457, đổi bằng `$env:PORT`; chi tiết cài đặt xem README.md):

- `smartcity-ioc/` — IOC Smart City (đang phát triển chính)
- `stadium-ioc/` — IOC sân vận động (PVF Stadium)
- `shared-ioc/` — CSS component + JS dùng chung (`bootstrap.js`, `router.js`, `render/hud-tabs.js`...)

Lệnh phụ khi agent cần server nền: `npm run dev:start` / `dev:check` / `dev:stop`.

## Luồng kiến trúc (giống nhau ở cả 2 app)

```
partials/pages/*.html                        (khung trang, chứa các [data-mount])
  → assets/js/pages/*-page-hydration.js     (phễu duy nhất: lấy data, gọi render, gắn vào [data-mount])
  → assets/js/services/data-service.js     (getData/subscribe; provider chọn trong data-config.js)
  → assets/js/render/*.js                   (hàm nhận data qua tham số, trả HTML string)
  → assets/js/data/*.js                     (mock data tĩnh — MockProvider trả nguyên các object này)
  → assets/js/scene/*.js                    (Three.js 3D, load .glb từ assets/models/)
  → assets/js/charts/*.js                   (Chart.js, đăng ký theo trang qua *-chart-registry.js)
```

Entry point mỗi app: `smartcity-ioc/assets/js/smartcity-app.js`, `stadium-ioc/assets/js/stadium-app.js`.

Cả 2 app đã có tầng data-service (Phase 6): hydration gọi `await getData(pageId)`;
đổi nguồn dữ liệu (mock/REST/WebSocket) chỉ cần sửa `services/data-config.js` của app đó,
KHÔNG sửa render. Domain `security` của stadium gộp `{ interior, exterior, legend }`;
domain `reports` của stadium đọc từ `data/stadium-report-store.js` (store cục bộ).

3 trang environment/utilities/reports của smartcity: data nằm ở
`data/smartcity-domain-panels-data.js`; panel nằm trong
`render/smartcity-{environment,utilities,reports}-panels.js`;
`render/smartcity-domain-command-panels.js` chỉ là aggregator giữ API
`renderSmartcityDomainLeft/Right(pageId, data)` + các hàm `bind*`.

## Quy tắc

- Sửa UI panel → tìm trong `render/`; sửa số liệu mock → `data/`; sửa 3D → `scene/`;
  sửa chart → `charts/` (đăng ký qua `smartcity-chart-registry.js` / `stadium-chart-registry.js`).
- Import có query string `?v=...` là cache-bust thủ công — khi đổi module scene phải cập nhật
  đồng bộ chuỗi version ở mọi chỗ import module đó.
- KHÔNG đọc/tham chiếu `archive/` (tài liệu cũ) và `smartcity-ioc/assets/blender/`
  (file nguồn Blender, không phải web asset).
- Model 3D (.glb/.blend) quản lý bằng Git LFS (`.gitattributes`). File nguồn:
  `smartcity-ioc/assets/blender/smartcity-master.blend`; export ra GLB bằng
  `npm run blender:smartcity:export`.
- Test: `npm run test:stadium` (Playwright, chạy `tests/stadium-visual.spec.js`).
  Chưa có test cho smartcity.

## Dùng chung & phân kỳ có chủ đích

Đã hợp nhất về `shared-ioc` (cả 2 app cùng dùng, KHÔNG tạo bản copy mới):
`render/hud-block-drag.js`, `render/sidebar-resize.js` (nhận `{ storageNamespace }`),
`charts/chart-font.js`, `render/hud-primitives.js` (`hudHead`, `piePoint`, `piePath`).

Phân kỳ CÓ CHỦ ĐÍCH — đừng "hợp nhất" các thứ sau:
- `ringSvg` có 3 bản (security-panels-right, traffic-panels-right, stadium hud-charts)
  với kích thước/màu/class khác nhau theo từng chỗ dùng.
- Boilerplate three.js (`setupRenderer`/`setupLighting`/`createScene`) và
  `tweenCamera`/`shortestAngleDelta` được tinh chỉnh riêng theo từng scene
  (pixelRatio, exposure, thời lượng tween, công thức góc của traffic sim).
- Chart mini trong HUD cố ý vẽ bằng SVG string (không dùng Chart.js) để nhẹ —
  đây là chủ đích, đừng "sửa" thành Chart.js.
