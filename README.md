# Vinsmartcity

Prototype website cho Smart City IOC va Stadium IOC.

## Yeu cau

- Node.js 20 LTS tro len
- npm 10 tro len
- PowerShell neu can chay script export Excel

## Cai dat

```powershell
npm ci
```

Neu PowerShell bao loi `npm.ps1 cannot be loaded because running scripts is disabled`, dung `npm.cmd` thay cho `npm`:

```powershell
npm.cmd ci
```

Neu muon chay test Playwright lan dau:

```powershell
npx playwright install chromium
```

## Chay website

Lenh chay website chinh:

```powershell
npm run dev
```

Tren Windows PowerShell co the dung:

```powershell
npm.cmd run dev
```

Sau khi server chay, mo mot trong cac URL sau:

- Smart City IOC: http://localhost:3457/smartcity-ioc/smartcity-index.html
- Stadium IOC: http://localhost:3457/stadium-ioc/stadium-index.html

Trang mac dinh khi vao `http://localhost:3457/` la Smart City IOC.

Neu gap loi `EADDRINUSE: address already in use :::3457`, port 3457 dang co server khac chay. Co the doi port bang:

```powershell
$env:PORT=3458; npm.cmd run dev
```

## Test

```powershell
npm run test:stadium
```

Trong Codex sandbox, Playwright co the bi Windows chan khi mo Chromium voi loi `spawn EPERM`. Khi do chay lai lenh test voi quyen ngoai sandbox/approval; day la gioi han moi truong, khong phai loi app.

## Ghi chu cho Codex agent

Nguoi dung chay website bang `npm run dev`. Cac lenh duoi day chi la tien ich phu khi agent can bat server nen hoac kiem tra moi truong:

```powershell
npm.cmd run dev:start
npm.cmd run dev:check
npm.cmd run dev:stop
```

Khong dung cac lenh phu nay thay cho huong dan chay website thong thuong.

## Export Excel

```powershell
npm run export:ke-hoach
```

## Ghi chu

- Dependency duoc quan ly bang `package.json` va `package-lock.json`.
- Khong commit `node_modules`, report test, log, file Excel export hoac artifact sinh tu kiem thu.
