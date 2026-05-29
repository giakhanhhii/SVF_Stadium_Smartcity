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

## Test

```powershell
npm run test:stadium
```

## Export Excel

```powershell
npm run export:ke-hoach
```

## Ghi chu

- Dependency duoc quan ly bang `package.json` va `package-lock.json`.
- Khong commit `node_modules`, report test, log, file Excel export hoac artifact sinh tu kiem thu.
