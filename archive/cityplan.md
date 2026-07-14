# Smart City 3D Scene Plan

## Goal

Build one shared 3D city model in the center of the IOC Smart City UI. All 6 tabs must reuse this same scene and move the camera to the relevant zone, like the Stadium module.

Important: this is a Vietnamese website. All user-facing labels, hints, markers, tooltips, panel titles, alerts, and scene text must use Vietnamese with proper accents.

Tabs:

- Tổng quan
- Giao thông
- An ninh
- Môi trường
- Tiện ích
- Báo cáo

The model should show a modern city with roads, buildings, vehicles, traffic lights, CCTV/security assets, environment sensors, utilities, and incident markers.

## Current Code Context

Smart City currently has separate scenes:

- `smartcity-ioc/assets/js/scene/security-building-scene.js`
- `smartcity-ioc/assets/js/scene/traffic-road-scene.js`
- `smartcity-ioc/assets/js/scene/smartcity-scene-registry.js`
- `smartcity-ioc/assets/js/data/building-scene.js`
- `smartcity-ioc/assets/js/data/traffic-scene.js`

Stadium already has the desired pattern:

- `stadium-ioc/assets/js/scene/stadium-scene-runtime.js`
- `stadium-ioc/assets/js/scene/stadium-camera.js`
- `stadium-ioc/assets/js/scene/stadium-scene-registry.js`

Use the Stadium approach: initialize one runtime scene, keep the renderer alive, append the canvas to the active page container, and call `applyPageView(pageId)` to tween the camera.

## Proposed Files

Create:

- `smartcity-ioc/assets/js/scene/smartcity-scene-runtime.js`
- `smartcity-ioc/assets/js/scene/smartcity-camera.js`
- `smartcity-ioc/assets/js/data/smartcity-scene-data.js`
- Optional helpers:
  - `smartcity-roads.js`
  - `smartcity-traffic.js`
  - `smartcity-security-layer.js`
  - `smartcity-environment-layer.js`
  - `smartcity-utilities-layer.js`

Update:

- `smartcity-ioc/assets/js/scene/smartcity-scene-registry.js`
- Smart City page containers so all 6 tabs can use `data-mount="smartcity-scene"`.

## Scene Layout

Base city:

- Central business district with varied high-rise buildings.
- Main intersection with two crossing roads.
- Ring road or side roads around the city blocks.
- Sidewalks, lane markings, pedestrian crossings.
- Small park, water/pond, trees, parking, bus stop.
- Distant skyline/buildings for depth.

Traffic layer:

- Moving cars, buses, and motorbikes.
- Traffic lights at the main intersection.
- Vehicles slow/stop at red lights.
- Traffic density markers: green/yellow/red.
- Traffic incident marker near the intersection.

Security layer:

- CCTV cameras on buildings, poles, and traffic lights.
- Camera coverage cones.
- Patrol team / response unit marker.
- Security incident, blacklist, or access alert marker.
- Security and traffic should overlap at the intersection: traffic cameras also act as security cameras.

Environment layer:

- PM2.5, temperature, humidity sensors.
- Transparent heatmap planes.
- Park/water area as the main environment focus.

Utilities layer:

- Power, water, camera, lighting, and IoT stations.
- Small status markers for active/fault devices.

Reports layer:

- Higher overview camera.
- Summary markers and small 3D bars for traffic, security, energy, and environment metrics.

## Camera Presets

Store presets in `smartcitySceneData.cameraPresets`.

```js
cameraPresets: {
  overview: { pos: [24, 26, 34], target: [0, 3, 0], fov: 42, hint: 'Tổng quan thành phố' },
  traffic: { pos: [18, 16, 18], target: [0, 1.2, 0], fov: 38, hint: 'Theo dõi giao thông' },
  security: { pos: [10, 18, 16], target: [4, 8, -3], fov: 36, hint: 'Camera an ninh và đội xử lý' },
  environment: { pos: [-18, 15, 16], target: [-7, 2, 5], fov: 40, hint: 'Cảm biến môi trường' },
  utilities: { pos: [18, 14, -18], target: [8, 2, -8], fov: 38, hint: 'Hạ tầng tiện ích' },
  reports: { pos: [0, 34, 38], target: [0, 2, 0], fov: 48, hint: 'Báo cáo tổng hợp' }
}
```

## Vietnamese Copy Requirement

Keep implementation identifiers in English, but all visible UI copy must be Vietnamese with accents.

Examples:

- Use `Tổng quan`, not `Tong quan` or `Overview`.
- Use `Giao thông`, not `Giao thong` or `Traffic`.
- Use `An ninh`, not `Security`.
- Use `Môi trường`, not `Moi truong` or `Environment`.
- Use `Tiện ích`, not `Tien ich` or `Utilities`.
- Use `Báo cáo`, not `Bao cao` or `Reports`.
- Use marker labels such as `Sự cố giao thông`, `Camera giám sát`, `Đội xử lý`, `Cảm biến PM2.5`.

## Runtime Behavior

- Initialize the scene once.
- Reuse the same renderer across all tabs.
- On tab change:
  - move the canvas into the new tab's scene container
  - call `applyPageView(pageId)`
  - tween camera to the preset
  - emphasize the relevant layer without hiding the whole city

Suggested focus behavior:

```js
applyLayerFocus(pageId) {
  setGroupEmphasis('traffic', pageId === 'traffic');
  setGroupEmphasis('security', pageId === 'security');
  setGroupEmphasis('environment', pageId === 'environment');
  setGroupEmphasis('utilities', pageId === 'utilities');
  setReportOverlaysVisible(pageId === 'reports');
}
```

## Data Model

Create `smartcity-scene-data.js`:

```js
export const smartcitySceneData = {
  cameraPresets: {},
  roads: [],
  intersections: [],
  buildings: [],
  vehicles: [],
  trafficLights: [],
  cameras: [],
  sensors: [],
  utilities: [],
  incidents: [],
  reportBars: []
};
```

Reuse existing data from:

- `building-scene.js`
- `traffic-scene.js`

Add `group` and optional `linkedGroup` fields so security and traffic can share objects:

```js
{ id: 'cam-traffic-01', group: 'security', linkedGroup: 'traffic', pos: [5.5, 4, -5.5] }
```

## Acceptance Criteria

- All 6 tabs use one shared Smart City 3D scene.
- Clicking each tab moves the camera to the correct area.
- The scene includes buildings, roads, vehicles, traffic lights, CCTV/security, sensors, utilities, and report markers.
- Traffic and security are visually connected at the same city/intersection area.
- The renderer is not recreated on every tab change.
- Scene remains performant and visually stable on desktop/mobile.
