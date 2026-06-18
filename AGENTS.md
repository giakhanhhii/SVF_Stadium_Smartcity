# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Vinsmartcity IOC — a pure front-end prototype (no backend, no database) with two Smart City dashboard UIs:
- **Smart City IOC** (`smartcity-ioc/`) — city-wide operations center with 3D scenes (Three.js)
- **Stadium IOC** (`stadium-ioc/`) — stadium operations center with 3D stadium model
- **Shared library** (`shared-ioc/`) — common CSS, layout, router, render helpers

### Running the dev server

```
npm run dev
```
Starts a static file server on port 3457. Required for ES modules and `fetch()` of HTML partials to work (CORS blocks `file://`).

- Root URL `/` redirects to `/smartcity-ioc/index.html`
- Stadium dashboard at `/stadium-ioc/index.html`

### Running tests

```
npm run test:stadium
```
Runs Playwright visual regression tests (3 tests). Playwright auto-starts the dev server via `webServer` config if not already running. Tests take ~3 minutes due to 3D scene rendering timeouts.

Playwright requires Chromium installed: `npx playwright install --with-deps chromium`

### Key notes

- No build step — the dev server serves raw files directly (no bundler).
- Three.js and Chart.js load from CDN at runtime — internet access is required for full rendering.
- The `canvas` npm package (native C++ addon) is only used by the offline stadium GLB generator script (`npm run generate:stadium`), not by the web app itself.
- There is no linter configured in this project (no ESLint, no Prettier config).
- The smoke test script (`scripts/ioc-smoke-test.mjs`) is Windows-only (requires Microsoft Edge).
