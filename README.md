# Vinsmartcity

Prototype website cho Smart City IOC và Stadium IOC.

## Yêu cầu

- Node.js 20 LTS trở lên
- npm 10 trở lên
- PowerShell nếu cần chạy script export Excel

## Git LFS (bắt buộc)

Các file model `.glb` và `.blend` được lưu bằng Git LFS. Trước khi clone/pull phải cài Git LFS, nếu không sẽ thiếu model (ống ngầm, sân vận động... không load được vì chỉ tải về file con trỏ thay vì file thật):

1. Cài Git LFS tại https://git-lfs.com (hoặc `winget install GitHub.GitLFS`)
2. Chạy 3 lệnh sau rồi mở lại app bằng `npm run dev`:

```powershell
git lfs install
git lfs pull
npm ci
```

Kiểm tra nhanh: mở `smartcity-ioc/assets/models/smartcity/pipes.glb`. Nếu nội dung là text kiểu `version https://git-lfs.github.com/spec/v1` thì file model chưa được tải về (thiếu LFS), chạy lại `git lfs pull`.

## Cài đặt

Chạy lệnh cài đặt trước để tải đủ dependency, giúp `npm run dev` chạy được:

```powershell
npm ci
```

Nếu muốn chạy test Playwright lần đầu:

```powershell
npx playwright install chromium
```

## Chạy website

Lệnh chạy website:

```powershell
npm run dev
```

Trên Windows PowerShell có thể dùng:

```powershell
npm.cmd run dev
```

Sau khi server chạy, mở một trong các URL sau:

- Smart City IOC: http://localhost:3457/smartcity-ioc/smartcity-index.html
- Stadium IOC: http://localhost:3457/stadium-ioc/stadium-index.html

Trang mặc định khi vào `http://localhost:3457/` là Stadium IOC, mở vào phần Tổng quan.

## Nếu Báo Lỗi

Nếu bị thiếu ống ngầm hoặc không load được model sân vận động, xem lại phần [Git LFS (bắt buộc)](#git-lfs-bắt-buộc) ở trên.

Nếu PowerShell báo lỗi `npm.ps1 cannot be loaded because running scripts is disabled`, dùng `npm.cmd` thay cho `npm`:

```powershell
npm.cmd ci
npm.cmd run dev
```

Nếu gặp lỗi `EADDRINUSE: address already in use :::3457`, port 3457 đang có server khác chạy. Có thể đổi port bằng:

```powershell
$env:PORT=3458; npm.cmd run dev
```

Trong Codex sandbox, Playwright có thể bị Windows chặn khi mở Chromium với lỗi `spawn EPERM`. Khi đó chạy lại lệnh test với quyền ngoài sandbox/approval; đây là giới hạn môi trường, không phải lỗi app.

## Test

```powershell
npm run test:stadium
```

## Ghi Chú Cho AI Agent

Xem [CLAUDE.md](CLAUDE.md) — bản đồ codebase, luồng kiến trúc, quy tắc sửa code và danh sách
file trùng lặp đã biết. Các lệnh tiện ích cho agent (`dev:start` / `dev:check` / `dev:stop`)
cũng ghi ở đó.

## Export Excel

```powershell
npm run export:ke-hoach
```

## Ghi Chú

- Dependency được quản lý bằng `package.json` và `package-lock.json`.
- Không commit `node_modules`, report test, log, file Excel export hoặc artifact sinh từ kiểm thử.
