# Kế hoạch dọn dẹp repo Vinsmartcity

> Mục tiêu: (1) giảm repo từ ~610 MiB xuống mức tối thiểu, dọn file rác/tài liệu cá nhân khỏi root;
> (2) làm codebase "sạch context" cho AI coding agent — không còn file thừa để grep trúng;
> (3) mở sẵn seam để cắm dữ liệu IOC thật / stream sau này.
> **Tuyệt đối không làm hỏng web** (Smart City IOC + Stadium IOC).
> Mỗi phase = 1 commit riêng, verify web chạy được sau mỗi phase trước khi sang phase kế tiếp.
>
> Phạm vi thực hiện ngay: Phase 0 → 4. Phase 5 (rewrite history) chờ chủ repo duyệt.
> Phase 6 (data-service + refactor) là lộ trình kế tiếp, làm ở đợt riêng.

## Bối cảnh đã khảo sát (đừng khảo sát lại từ đầu)

- Repo pack ~610 MiB; ~386 MiB là blob lớn nằm trong **lịch sử git** từ trước khi chuyển sang Git LFS
  (`smartcity-master.blend` + `.blend1` ~180 MiB, `pipes.glb` 71 MiB, ...). Commit `8aaa4b27` đã bật LFS
  cho `.blend`/`.glb` nhưng không viết lại lịch sử.
- `stadium-ioc/vendor-node_modules/` đang bị **track 3.484 file** (93% tổng số file trong repo).
  `.gitignore` đã có rule `**/vendor-node_modules/` nhưng file commit từ trước nên rule không tác dụng.
  **Đã kiểm tra: không có HTML/JS/CSS/mjs nào tham chiếu tới thư mục này** → untrack an toàn.
- 14 file snapshot thủ công `smartcity-ioc/assets/blender/smartcity-master_before_*.blend` (mỗi file 0.6–1 MB, LFS)
  + ~20 ảnh `*-check.png` QA tạm trong cùng thư mục. **Đã kiểm tra: không script nào đọc các file `before_*`**
  (grep "before_" chỉ khớp biến Python `before_objects` trong `create_smartcity_master.py`) → xoá an toàn.
- `scripts/blender/__pycache__/*.pyc` đang bị track (3 file).
- Root repo lẫn tài liệu cá nhân/báo cáo/mockup cũ với code sản phẩm (danh sách ở Phase 3).
- Remote: `origin = https://github.com/giakhanhhii/SVF_Stadium_Smartcity.git`, chỉ có nhánh `main`.
- Lưu ý quan trọng: `docs/` **đang nằm trong `.gitignore`** — KHÔNG di chuyển file cần giữ vào `docs/`
  (sẽ bị untrack âm thầm). Dùng thư mục `archive/` mới.

## Vùng CẤM ĐỤNG (runtime của web)

KHÔNG xoá/di chuyển/đổi tên bất kỳ thứ gì dưới đây:

- `smartcity-ioc/` — trừ đúng các file liệt kê ở Phase 2 bên trong `assets/blender/`
- `stadium-ioc/assets/` (css/js/models), `stadium-ioc/partials/`, `stadium-ioc/stadium-index.html`
- `shared-ioc/` toàn bộ
- `scripts/` toàn bộ (trừ `__pycache__/`)
- `package.json`, `package-lock.json`, `playwright.config.js`, `tests/`, `README.md`, `.gitattributes`, `.gitignore` (chỉ được THÊM rule)
- `smartcity-ioc/assets/blender/smartcity-master.blend` (file nguồn Blender đang dùng),
  `performance-report.json`, `README.md` trong cùng thư mục — GIỮ LẠI

## Chiến lược nhánh, push & điểm rollback (áp dụng cho MỌI phase)

Toàn bộ việc dọn dẹp làm trên **nhánh riêng**, KHÔNG commit thẳng vào `main`:

```powershell
git checkout -b chore/repo-cleanup
```

Sau khi hoàn thành và verify MỖI phase:

```powershell
git commit -m "<message của phase>"
git tag cleanup-phase-N          # N = số phase, điểm rollback chính xác
git push -u origin chore/repo-cleanup --tags
```

- `main` không bị đụng tới trong suốt quá trình → web bản đang chạy luôn khôi phục được bằng
  `git checkout main`.
- Mỗi phase đã push lên GitHub → hỏng máy local cũng không mất.
- Merge `chore/repo-cleanup` vào `main` CHỈ sau khi checklist nghiệm thu cuối pass
  và chủ repo xác nhận. Không tự merge.

**Rollback khi phase N hỏng** (chọn 1 trong 2, ưu tiên cách 1):

```powershell
# Cách 1 — revert (an toàn, giữ lịch sử, dùng khi đã push):
git revert <commit-phase-N>
git push origin chore/repo-cleanup

# Cách 2 — reset về tag phase trước (chỉ trên nhánh cleanup, chấp nhận force-push nhánh này):
git reset --hard cleanup-phase-(N-1)
git push --force origin chore/repo-cleanup
```

File bị xoá ở bất kỳ phase nào đều khôi phục được: `git checkout cleanup-phase-(N-1) -- <path>`.

**Quy tắc để rollback chính xác**: toàn bộ thay đổi `.gitignore` gom vào MỘT commit riêng duy nhất
(Phase 1, commit 1a). Các phase sau tuyệt đối không sửa `.gitignore` nữa — nhờ vậy revert bất kỳ
phase nào cũng chỉ revert file move/delete, không bao giờ kéo theo rule ignore, không gây conflict.

## Phase 0 — Baseline: xác nhận web đang chạy tốt TRƯỚC khi dọn

```powershell
npm.cmd ci
npm.cmd run dev   # server tại http://localhost:3457
```

Smoke test (bắt buộc, dùng browser tự động hoặc mở tay):

1. `http://localhost:3457/smartcity-ioc/smartcity-index.html` — trang Tổng quan render, không lỗi console nghiêm trọng, scene 3D hiện.
2. `http://localhost:3457/stadium-ioc/stadium-index.html` — tương tự.
3. Chuyển qua vài tab điều hướng ở mỗi app (Giao thông, An ninh... / Sự kiện, Cơ sở vật chất...).
4. `npm.cmd run test:stadium` — ghi lại kết quả baseline (kể cả nếu có test fail sẵn, ghi chú lại để so sánh sau).

Nếu baseline đã hỏng sẵn thứ gì → ghi chú, KHÔNG sửa, chỉ cần đảm bảo sau khi dọn không tệ hơn.

## Phase 1 — Chốt `.gitignore` + untrack file rác (2 commit: 1a và 1b)

**Commit 1a — chỉ sửa `.gitignore`, không sửa gì khác.** Thêm block sau vào cuối file
(các rule hiện có giữ nguyên, rule `**/vendor-node_modules/` đã có sẵn):

```
# Python bytecode
__pycache__/
*.pyc

# Blender/MCP experiment outputs (đã gỡ tracking ở cleanup Phase 2)
outputs/

# Agent-generated local artifacts
.codex/
```

Commit: `chore: finalize .gitignore before cleanup`

**Commit 1b — untrack (giữ nguyên file trên đĩa, web local không ảnh hưởng):**

```powershell
git rm -r --cached stadium-ioc/vendor-node_modules
git rm -r --cached scripts/blender/__pycache__
git rm -r --cached .codex
```

Commit: `chore: untrack vendored node_modules, __pycache__, .codex artifacts`

- Verify: chạy lại smoke test Phase 0 (server vẫn đang chạy thì chỉ cần reload 2 URL),
  rồi tag `cleanup-phase-1` + push theo chiến lược ở đầu file.

## Phase 2 — Xoá snapshot Blender thủ công + ảnh QA tạm (commit 2)

Xoá (git rm, xoá thật khỏi working tree) trong `smartcity-ioc/assets/blender/`:

- Toàn bộ `smartcity-master_before_*.blend` (14 file)
- Toàn bộ `*-check.png` trong thư mục này (arrow-sync-check.png, crosswalk-sync-check.png, moto-veh-*, web-moto-*, yellow-veh-*, urban-fill-check.png...)

GIỮ LẠI: `smartcity-master.blend`, `performance-report.json`, `README.md`.

Cũng xoá tracking thư mục thí nghiệm: `git rm -r outputs/` (4 file .blend test MCP + rác, không liên quan web).

- Lý do an toàn: các snapshot là backup tay, lịch sử git vẫn giữ chúng nếu cần khôi phục; không code nào đọc chúng.
- Commit: `chore: remove manual blend snapshots, QA screenshots, and mcp-test outputs`
- Verify: reload 2 URL — web không load gì từ `assets/blender/` nên phải y nguyên.
  Tag `cleanup-phase-2` + push.

## Phase 3 — Dọn root cho sạch context AI (commit 3)

Mục đích kép: root gọn cho người, và AI coding agent không grep trúng file thừa.
Lưu ý: tool search của AI (ripgrep) tôn trọng `.gitignore` — các thư mục đã ignore
(`node_modules`, `UnityMcp*`, `docs/`, `test-results`...) vốn đã vô hình với AI.
Vấn đề chỉ nằm ở file **đang tracked**. Xử lý theo 3 nhóm:

**Nhóm A — XOÁ HẲN khỏi working tree** (`git rm`; lịch sử git vẫn giữ, khôi phục được bất cứ lúc nào
bằng `git checkout <commit-cũ> -- <path>`). Đây là các mockup/bản nháp đã bị web hiện tại thay thế,
chứa đầy từ khóa "IOC/smartcity/dashboard" dễ làm AI đọc nhầm thành code thật:

- `ioc_realtime_dashboard.html`, `ioc_smartcity_homepage_mockup.html`, `ioc_smartcity_prototype.html`, `stadium.html`
- `figma-ioc-prototype/` (toàn bộ)
- `plan.md` (kế hoạch sprint cũ đã xong)

**Nhóm B — ĐƯA RA NGOÀI REPO** (di chuyển tới thư mục ngoài dự án, ví dụ
`C:\Users\Administrator\Documents\Vinsmartcity-docs\`, rồi `git rm` trong repo).
Tài liệu cá nhân/báo cáo không thuộc về codebase sản phẩm:

- `NguyenTrieuGiaKhanh_RESEARCH.md`, `NguyenTrieuGiaKhanh_KE_HOACH_TRIEN_KHAI.md`
- `build-ioc-research-docx.mjs`
- `export-ioc-progress-excel.ps1` + `progress-data.json` (cặp đôi: script đọc file json này — chuyển cùng nhau)

**Nhóm C — GIỮ TRONG REPO, chuyển vào `archive/`** (`git mv`; team còn cần tra cứu):

- `IOC_SYSTEM_BRD_SRS.md` (đặc tả yêu cầu)
- `cityplan.md` (quy hoạch layout thành phố — tham chiếu khi sửa scene)

KHÔNG đụng: `README.md`, `requirement.txt`, `package.json`, `playwright.config.js`, các thư mục app.

Trước khi xoá/mv từng file, grep xác nhận không file nào trong `smartcity-ioc/`, `stadium-ioc/`,
`shared-ioc/`, `scripts/`, `tests/` tham chiếu tên file đó. Có tham chiếu → bỏ qua file đó, ghi chú lại.

- Commit: `chore: remove legacy mockups, relocate personal docs, archive specs`
- Verify: smoke test 2 URL + `npm.cmd run test:stadium`, so với baseline.
  Tag `cleanup-phase-3` + push.

## Phase 4 — Tạo CLAUDE.md: bản đồ codebase cho AI agent (commit 4)

Repo hiện KHÔNG có CLAUDE.md/AGENTS.md — đây là file quan trọng nhất để AI làm việc đúng chỗ.
Tạo `CLAUDE.md` ở root với nội dung theo khung sau (viết lại tự nhiên, xác minh từng đường dẫn
còn đúng tại thời điểm viết):

```markdown
# Vinsmartcity — hướng dẫn cho AI agent

Prototype web IOC (trung tâm điều hành) gồm 2 app tĩnh, không build step, chạy bằng `npm run dev`
(port 3457, xem README.md):
- `smartcity-ioc/` — IOC Smart City (đang phát triển chính)
- `stadium-ioc/` — IOC sân vận động
- `shared-ioc/` — CSS component + JS dùng chung (bootstrap, router, hud-tabs...)

## Luồng kiến trúc (giống nhau ở cả 2 app)
partials/pages/*.html (khung trang)
  → assets/js/pages/*-page-hydration.js (phễu duy nhất: lấy data, gọi render, gắn vào [data-mount])
  → assets/js/render/*.js (hàm nhận data qua tham số, trả HTML string)
  → assets/js/data/*.js (mock data tĩnh — sau này thay bằng data-service)
  → assets/js/scene/*.js (Three.js 3D, load .glb từ assets/models/)
  → assets/js/charts/*.js (Chart.js, đăng ký theo trang qua *-chart-registry.js)

## Quy tắc
- Sửa UI panel → tìm trong `render/`; sửa số liệu mock → `data/`; sửa 3D → `scene/`.
- CẢNH BÁO trùng tên: `hud-block-drag.js`, `sidebar-resize.js` tồn tại ở CẢ `shared-ioc` và
  `stadium-ioc` với nội dung khác nhau. Smartcity dùng bản `shared-ioc`; stadium dùng bản riêng.
  Kiểm tra import trong `*-app.js` trước khi sửa để chọn đúng bản.
- Import có query string `?v=...` là cache-bust thủ công — khi đổi module scene phải cập nhật đồng bộ.
- KHÔNG đọc/tham chiếu `archive/` (tài liệu cũ), `smartcity-ioc/assets/blender/` (file nguồn Blender,
  không phải web asset).
- Model 3D (.glb/.blend) quản lý bằng Git LFS. File nguồn: `smartcity-master.blend`;
  export ra GLB bằng `npm run blender:smartcity:export`.
- Test: `npm run test:stadium` (Playwright). Chưa có test cho smartcity.

## Trùng lặp đã biết — KHÔNG tạo thêm bản copy mới
Các helper sau đang bị copy-paste nhiều nơi (nợ kỹ thuật, sẽ hợp nhất sau —
xem CLEANUP_PLAN.md Phase 6). Khi cần dùng: import/tái sử dụng bản trong file
cùng app gần nhất, TUYỆT ĐỐI không viết thêm bản mới:
- `hudHead()` — 7 bản trong các file render smartcity + `stadium-ioc/.../hud-charts.js`
- `ringSvg()`/`piePath()`/`piePoint()` (chart SVG mini) — 5–6 bản trong render
- `setupRenderer()`/`createScene()`/`setupLighting()`/`animate()` (boilerplate three.js) —
  3 bản giữa scene-runtime của 2 app
- `tweenCamera()`, `shortestAngleDelta()` — 2 bản giữa smartcity/stadium camera
Ghi chú thiết kế: chart mini trong HUD cố ý vẽ bằng SVG string (không dùng Chart.js)
để nhẹ — đây là chủ đích, đừng "sửa" thành Chart.js.
```

Đồng thời cập nhật `README.md`: bỏ mục "Ghi Chú Cho Codex Agent" nếu trùng lặp, trỏ sang CLAUDE.md.

- Commit: `docs: add CLAUDE.md codebase map for AI agents`
- Verify: không đụng code — chỉ cần `git diff --stat` xác nhận chỉ có file .md thay đổi.
  Tag `cleanup-phase-4` + push.

## Phase 5 — (TÙY CHỌN, cần chủ repo quyết định) Viết lại lịch sử để giảm 610 MiB

⚠️ KHÔNG tự làm phase này trong session dọn dẹp. Chỉ thực hiện khi chủ repo xác nhận, vì:
force-push lên `origin/main`, mọi clone hiện có phải re-clone, mọi commit hash đổi.

Khi được duyệt, cách làm:

```powershell
# backup trước
git clone --mirror https://github.com/giakhanhhii/SVF_Stadium_Smartcity.git backup-mirror.git

# đưa toàn bộ file lớn trong lịch sử vào LFS + loại bỏ các path đã xoá
git lfs migrate import --everything --include="*.blend,*.blend1,*.glb"
# (vendor-node_modules và các file đã git rm ở Phase 1-2 vẫn còn trong history;
#  nếu muốn sạch hẳn, dùng git-filter-repo để drop các path đó)

git push --force origin main
```

Sau đó chạy `git gc --aggressive --prune=now` local và kiểm tra `git count-objects -vH` — kỳ vọng pack < 50 MiB (chưa tính LFS storage).

## Phase 6 — (LỘ TRÌNH KẾ TIẾP, làm đợt riêng sau khi dọn xong) Seam cho dữ liệu thật/stream

KHÔNG làm trong session dọn dẹp. Ghi ở đây để định hướng — đây là điều kiện để nối API/WebSocket
thật vào IOC mà không phải viết lại render.

Hiện trạng seam (đã khảo sát):
- `smartcity-page-hydration.js` là **phễu duy nhất**: import 6 object mock từ `data/*.js` rồi truyền
  vào render function **qua tham số** → chèn tầng service vào đúng chỗ này là đủ, render không phải sửa.
- **Ngoại lệ phải xử lý trước**: 3 trang environment/utilities/reports gọi
  `renderSmartcityDomainLeft('environment')` — data bị nhúng cứng bên trong
  `render/smartcity-domain-command-panels.js` (2.580 dòng). Phải tách data của file này ra
  `data/*.js` trước thì seam mới kín.

Thiết kế đề xuất:

```
assets/js/services/data-service.js
  getData(domain)            // async — Provider quyết định nguồn
  subscribe(domain, onData)  // stream — gọi lại khi có dữ liệu mới

Providers (cùng interface, chọn qua config):
  MockProvider    → trả nguyên object trong data/*.js (mặc định, giữ web chạy như hiện tại)
  RestProvider    → fetch(`/api/${domain}`)
  StreamProvider  → WebSocket/SSE, mỗi message gọi onData → hydratePage(pageId) re-render
```

Các bước: (1) tách data khỏi `smartcity-domain-command-panels.js`; (2) tạo data-service +
MockProvider, đổi hydration sang `await getData(...)`; (3) bẻ nhỏ file 2.580 dòng theo panel;
(4) hợp nhất các file duplicate phân kỳ (`hud-block-drag.js`, `sidebar-resize.js`, `chart-font.js`)
về `shared-ioc`; (5) hợp nhất các helper bị copy-paste (danh sách trong mục "Trùng lặp đã biết"
của CLAUDE.md): `hudHead`, bộ SVG chart mini (`ringSvg`/`piePath`/`piePoint`) →
`shared-ioc/assets/js/render/hud-primitives.js`; boilerplate three.js (`setupRenderer`/
`setupLighting`), `tweenCamera`/`shortestAngleDelta` → `shared-ioc/assets/js/scene/scene-base.js`;
(6) làm tương tự cho stadium.

Điều kiện nghiệm thu của Phase 6: đổi provider trong config **không phải sửa bất kỳ file render nào**,
và MockProvider cho kết quả web giống hệt hiện tại.

## Checklist nghiệm thu cuối cùng

- [ ] Đang ở nhánh `chore/repo-cleanup`, `git status` sạch, `main` chưa bị đụng tới
- [ ] Mỗi phase có commit + tag `cleanup-phase-N` riêng, tất cả đã push lên origin (kèm `--tags`)
- [ ] CHƯA merge vào `main` — chờ chủ repo xác nhận
- [ ] `CLAUDE.md` tồn tại ở root, mọi đường dẫn trong đó đã xác minh còn đúng
- [ ] Root chỉ còn: README.md, CLAUDE.md, CLEANUP_PLAN.md, requirement.txt, package.json,
      package-lock.json, playwright.config.js, .gitignore, .gitattributes + các thư mục
      app/scripts/tests/archive
- [ ] `http://localhost:3457/smartcity-ioc/smartcity-index.html` hoạt động: scene 3D, chuyển tab, không lỗi console mới
- [ ] `http://localhost:3457/stadium-ioc/stadium-index.html` hoạt động tương tự
- [ ] `npm.cmd run test:stadium` không tệ hơn baseline Phase 0
- [ ] `git ls-files | wc -l` giảm từ 3.756 xuống ~250–300
- [ ] `smartcity-master.blend` vẫn còn và vẫn là LFS pointer hợp lệ (`git lfs ls-files` có nó)
- [ ] Không file nào trong Vùng CẤM ĐỤNG bị thay đổi (kiểm bằng `git diff --stat` từng commit)

## Rollback

Xem mục "Chiến lược nhánh, push & điểm rollback" ở đầu file. Tóm tắt:
mỗi phase = 1 commit + 1 tag `cleanup-phase-N` đã push → hỏng phase nào thì
`git revert <commit-phase-đó>` (ưu tiên) hoặc `git reset --hard cleanup-phase-(N-1)`
+ force-push riêng nhánh cleanup. `main` luôn nguyên vẹn làm phao cứu sinh cuối cùng.
File đã xoá khôi phục bằng `git checkout cleanup-phase-(N-1) -- <path>`.
