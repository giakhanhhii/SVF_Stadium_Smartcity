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
  → assets/js/pages/*-page-hydration.js     (phễu duy nhất: import data, gọi render, gắn vào [data-mount])
  → assets/js/render/*.js                   (hàm nhận data qua tham số, trả HTML string)
  → assets/js/data/*.js                     (mock data tĩnh — sau này thay bằng data-service)
  → assets/js/scene/*.js                    (Three.js 3D, load .glb từ assets/models/)
  → assets/js/charts/*.js                   (Chart.js, đăng ký theo trang qua *-chart-registry.js)
```

Entry point mỗi app: `smartcity-ioc/assets/js/smartcity-app.js`, `stadium-ioc/assets/js/stadium-app.js`.

Ngoại lệ đã biết: 3 trang environment/utilities/reports của smartcity gọi
`renderSmartcityDomainLeft('environment' | 'utilities' | 'reports')` — data của các panel này
đang nhúng cứng bên trong `render/smartcity-domain-command-panels.js` (~2.400 dòng),
chưa tách ra `data/*.js`.

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

## Trùng lặp đã biết — KHÔNG tạo thêm bản copy mới

Các file sau tồn tại ở 2 nơi với nội dung ĐÃ PHÂN KỲ (không giống nhau). Kiểm tra import trong
`*-app.js` / `*-page-hydration.js` trước khi sửa để chọn đúng bản; không hợp nhất khi chưa có
yêu cầu (việc hợp nhất thuộc lộ trình Phase 6 trong CLEANUP_PLAN.md):

| File | Smartcity dùng | Stadium dùng |
| --- | --- | --- |
| `hud-block-drag.js` | `shared-ioc/assets/js/render/` | bản riêng `stadium-ioc/assets/js/render/` |
| `sidebar-resize.js` | `shared-ioc/assets/js/render/` | bản riêng `stadium-ioc/assets/js/render/` |
| `chart-font.js` | bản riêng `smartcity-ioc/assets/js/charts/` | bản riêng `stadium-ioc/assets/js/charts/` |
