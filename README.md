# Vinsmartcity

Prototype website cho Smart City IOC và Stadium IOC.

## Yêu cầu

- Node.js 20 LTS trở lên
- npm 10 trở lên
- PowerShell nếu cần chạy script export Excel

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

## Ghi Chú Cho Codex Agent

Người dùng chạy website bằng `npm run dev`. Các lệnh dưới đây chỉ là tiện ích phụ khi agent cần bật server nền hoặc kiểm tra môi trường:

```powershell
npm.cmd run dev:start
npm.cmd run dev:check
npm.cmd run dev:stop
```

Không dùng các lệnh phụ này thay cho hướng dẫn chạy website thông thường.

## Export Excel

```powershell
npm run export:ke-hoach
```

## Ghi Chú

- Dependency được quản lý bằng `package.json` và `package-lock.json`.
- Không commit `node_modules`, report test, log, file Excel export hoặc artifact sinh từ kiểm thử.
