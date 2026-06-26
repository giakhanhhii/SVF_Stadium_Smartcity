import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ===== Bản đồ thế giới georeferenced (toggle "Bật bản đồ" ở tab Tổng quan) =====
// Khi bật: phủ bản đồ thật MapLibre GL (raster OpenStreetMap, không cần token) lên khung
// cảnh, rồi đặt TOÀN BỘ mô hình Smart City 3D lên đúng tọa độ TechnoPark Tower (Vinhomes
// Ocean Park, Gia Lâm, Hà Nội) bằng một custom WebGL layer dùng chính scene Three.js hiện
// có. Mô hình là lớp 3D georeferenced THẬT (không phải overlay UI): bám mặt đất, tỉ lệ
// 1:1 mét thật → khi zoom ra mô hình co lại đúng theo tỉ lệ bản đồ, zoom vào thì to lên.
const WORLD_MAP_TECHNOPARK_LAT = 20.988877975879802;
const WORLD_MAP_TECHNOPARK_LON = 105.9420937450411;
const WORLD_MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const WORLD_MAP_TILE_ATTRIBUTION = '© OpenStreetMap contributors';
const WORLD_MAP_DETAIL_ZOOM = 17.5; // mức zoom khi mở: thấy TechnoPark 1:1 + phố xung quanh
const WORLD_MAP_DETAIL_PITCH = 55;  // nghiêng camera để thấy khối 3D dựng đứng
const WORLD_MAP_MIN_ZOOM = 2;       // thu nhỏ tới toàn thế giới (mô hình co theo)
const WORLD_MAP_MAX_ZOOM = 20;      // mức zoom tối đa
// 1 đơn vị Three.js ≈ bao nhiêu mét thật. Cảnh thành phố rộng ~120 đơn vị → ~480 m thật.
// Đổi giá trị này để tinh chỉnh "1:1 mét" cho khớp tỉ lệ mong muốn trên bản đồ.
const METERS_PER_SCENE_UNIT = 4;

// Factory: mỗi cảnh tạo 1 controller sở hữu state bản đồ trong closure (worldMap instance,
// overlay div, renderer dùng chung GL context, model matrix...). getRefs() trả về sceneRefs
// live của runtime (camera/controls/container/scene) — runtime gán lại sceneRefs nên đọc
// qua getRefs luôn đúng. Lộ API setMode/isEnabled/resize/dispose/flyToTechnopark cho runtime.
export function createWorldMap({ getRefs }) {
  let worldMapEnabled = false;
  let worldMap = null;        // instance maplibregl.Map (tạo 1 lần)
  let worldMapEl = null;      // div overlay chứa bản đồ, phủ lên canvas 3D
  let worldMapRenderer = null; // THREE.WebGLRenderer dùng chung GL context của MapLibre
  let worldMapLayerAdded = false; // đã add custom 3D layer vào map chưa
  let worldMapModelMatrix = null;

  function getWorldMapModelMatrix(scene) {
    if (worldMapModelMatrix) return worldMapModelMatrix;
    const origin = window.maplibregl.MercatorCoordinate.fromLngLat(
      [WORLD_MAP_TECHNOPARK_LON, WORLD_MAP_TECHNOPARK_LAT],
      0,
    );
    // mercator-units / mét tại vĩ độ này → nhân với mét/đơn-vị-cảnh = mercator-units/đơn-vị.
    const unitScale = origin.meterInMercatorCoordinateUnits() * METERS_PER_SCENE_UNIT;
    // Lấy TÂM (theo X,Z) của khối thành phố để cả thành phố nằm gọn quanh tọa độ thật —
    // nếu neo theo tòa TechnoPark (nằm ở góc cảnh) thì cả thành phố bị lệch hẳn sang một bên.
    let cx = 0;
    let cz = 0;
    try {
      const box = new THREE.Box3().setFromObject(scene);
      if (Number.isFinite(box.min.x) && Number.isFinite(box.max.x)) {
        cx = (box.min.x + box.max.x) / 2;
        cz = (box.min.z + box.max.z) / 2;
      }
    } catch (_) { /* cảnh chưa dựng xong — dùng gốc (0,0) */ }
    worldMapModelMatrix = new THREE.Matrix4()
      .makeTranslation(origin.x, origin.y, origin.z)
      // Y của mercator hướng xuống nam → lật trục Y (-unitScale) để hướng bắc khớp.
      .scale(new THREE.Vector3(unitScale, -unitScale, unitScale))
      // Cảnh Three.js Y-lên → mercator Z-lên: xoay +90° quanh trục X.
      .multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2))
      // Neo: đưa tâm thành phố về gốc (giữ y=0 để đáy bám mặt đất) → rơi đúng pin trên bản đồ.
      .multiply(new THREE.Matrix4().makeTranslation(-cx, 0, -cz));
    return worldMapModelMatrix;
  }

  // Custom WebGL layer của MapLibre: render CHÍNH scene Three.js hiện có vào canvas bản đồ,
  // dùng chung GL context. Camera được dựng từ ma trận chiếu của MapLibre mỗi khung hình →
  // mô hình bám đúng vị trí/tỉ lệ thật khi pan/zoom/xoay/nghiêng.
  function createWorldMap3DLayer(scene) {
    return {
      id: 'smartcity-3d-model',
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        worldMapRenderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        worldMapRenderer.autoClear = false;
        worldMapRenderer.outputColorSpace = THREE.SRGBColorSpace;
        worldMapRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        worldMapRenderer.toneMappingExposure = 1.28;
        worldMapRenderer.shadowMap.enabled = true;
        worldMapRenderer.shadowMap.type = THREE.PCFShadowMap;
        this._map = map;
        this._camera = new THREE.Camera();
        this._scene = scene;
        // envmap PBR phải tạo bằng CHÍNH renderer này (texture render-target gắn với GL
        // context của MapLibre). Dùng lại scene.environment của renderer gốc sẽ ra texture
        // rỗng ở context khác → vật liệu kính/PBR mất phản chiếu, đổi màu. Tạo riêng từ
        // cùng RoomEnvironment để màu/texture giống hệt cảnh 3D độc lập.
        const pmremMap = new THREE.PMREMGenerator(worldMapRenderer);
        this._envMap = pmremMap.fromScene(new RoomEnvironment(), 0.04).texture;
        pmremMap.dispose();
      },
      render(gl, arg) {
        // MapLibre v4: arg là object (defaultProjectionData.mainMatrix); bản cũ: arg là mảng.
        const matrix = Array.isArray(arg)
          ? arg
          : arg?.defaultProjectionData?.mainMatrix || arg?.mainMatrix;
        if (!matrix || !worldMapRenderer) return;
        const l = getWorldMapModelMatrix(this._scene);     // cảnh-local → mercator (đừng sửa)
        const vpl = new THREE.Matrix4().fromArray(matrix).multiply(l); // view-proj của MapLibre × l

        // Vật liệu kính (MeshPhysicalMaterial, metalness cao) phản chiếu phụ thuộc VỊ TRÍ MẮT.
        // Nếu để matrixWorld = đơn vị thì Three coi mắt ở gốc (0,0,0) → mặt tòa nhà phản chiếu
        // vùng tối của môi trường thành màu ĐEN. Lấy đúng vị trí mắt từ MapLibre, đổi về hệ
        // tọa-độ cảnh, đặt vào camera → phản chiếu đúng (xanh đều như cảnh gốc). Vẫn giữ
        // clip-position chuẩn: projectionMatrix·matrixWorldInverse = vpl (T_eye triệt tiêu).
        let eyeMerc = null;
        try {
          const cp = this._map.transform?.getCameraPosition?.();
          if (cp?.lngLat) {
            const mc = window.maplibregl.MercatorCoordinate.fromLngLat(
              [cp.lngLat.lng, cp.lngLat.lat], cp.altitude || 0,
            );
            eyeMerc = new THREE.Vector3(mc.x, mc.y, mc.z);
          }
        } catch (_) { eyeMerc = null; }
        if (eyeMerc) {
          const eyeLocal = eyeMerc.applyMatrix4(l.clone().invert());
          this._camera.position.copy(eyeLocal);
          this._camera.projectionMatrix = vpl.clone().multiply(
            new THREE.Matrix4().makeTranslation(eyeLocal.x, eyeLocal.y, eyeLocal.z),
          );
        } else {
          this._camera.position.set(0, 0, 0);
          this._camera.projectionMatrix = vpl;
        }

        // Tạm bỏ nền trời đặc (nếu không sẽ phủ kín, che hết bản đồ) và dùng envmap của
        // context này, render xong khôi phục để cảnh 3D độc lập (renderer gốc) không đổi.
        const prevBg = this._scene.background;
        const prevEnv = this._scene.environment;
        this._scene.background = null;
        this._scene.environment = this._envMap;
        worldMapRenderer.resetState();
        worldMapRenderer.render(this._scene, this._camera);
        this._scene.background = prevBg;
        this._scene.environment = prevEnv;
        // Giữ vòng vẽ liên tục để xe cộ/animation cập nhật mượt trên bản đồ.
        this._map.triggerRepaint();
      },
      onRemove() {
        this._envMap?.dispose();
        this._envMap = null;
      },
    };
  }

  // Tạo (1 lần, lazy) bản đồ MapLibre phủ kín khung cảnh + add custom 3D layer. Trả về
  // instance map hoặc null nếu thư viện maplibregl chưa nạp.
  function ensureWorldMap3D(container, scene) {
    if (worldMap) return worldMap;
    if (!container || typeof window === 'undefined' || !window.maplibregl) {
      console.warn('[smartcity-scene] maplibregl chưa sẵn sàng — chưa bật được bản đồ 3D.');
      return null;
    }

    const el = document.createElement('div');
    el.className = 'smartcity-world-map';
    container.appendChild(el);
    worldMapEl = el;

    const map = new window.maplibregl.Map({
      container: el,
      center: [WORLD_MAP_TECHNOPARK_LON, WORLD_MAP_TECHNOPARK_LAT],
      zoom: WORLD_MAP_DETAIL_ZOOM,
      pitch: WORLD_MAP_DETAIL_PITCH,
      minZoom: WORLD_MAP_MIN_ZOOM,
      maxZoom: WORLD_MAP_MAX_ZOOM,
      antialias: true,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [WORLD_MAP_TILE_URL],
            tileSize: 256,
            attribution: WORLD_MAP_TILE_ATTRIBUTION,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
    });
    map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Đánh dấu tâm TechnoPark để định hướng (mô hình 3D phủ ngay trên điểm này).
    new window.maplibregl.Marker({ color: '#16B6FF' })
      .setLngLat([WORLD_MAP_TECHNOPARK_LON, WORLD_MAP_TECHNOPARK_LAT])
      .setPopup(new window.maplibregl.Popup({ offset: 24 }).setText('TechnoPark Tower · Hà Nội'))
      .addTo(map);

    map.on('style.load', () => {
      if (worldMapLayerAdded) return;
      map.addLayer(createWorldMap3DLayer(scene));
      worldMapLayerAdded = true;
    });

    worldMap = map;
    if (typeof window !== 'undefined') window.__smartcityWorldMap = map;
    return map;
  }

  // Bật/tắt bản đồ 3D georeferenced. Bật: hiện bản đồ thật + lớp mô hình 3D phủ lên, tạm
  // dừng render của canvas Three.js độc lập (MapLibre tự lo việc vẽ scene). Tắt: ẩn bản đồ,
  // trả lại quyền điều khiển cho OrbitControls của cảnh 3D độc lập.
  function setMode(on) {
    worldMapEnabled = Boolean(on);
    const refs = getRefs();
    if (!refs) return;
    if (worldMapEnabled) {
      const map = ensureWorldMap3D(refs.container, refs.scene);
      if (!map) { worldMapEnabled = false; return; }
      worldMapEl.hidden = false;
      if (refs.controls) refs.controls.enabled = false;
      // Map chỉ đo đúng kích thước sau khi div hiển thị → resize rồi canh tâm về TechnoPark.
      requestAnimationFrame(() => {
        if (!worldMapEnabled || !worldMap) return;
        worldMap.resize();
        worldMap.jumpTo({
          center: [WORLD_MAP_TECHNOPARK_LON, WORLD_MAP_TECHNOPARK_LAT],
          zoom: WORLD_MAP_DETAIL_ZOOM,
          pitch: WORLD_MAP_DETAIL_PITCH,
        });
      });
    } else {
      if (worldMapEl) worldMapEl.hidden = true;
      if (refs.controls) refs.controls.enabled = true;
    }
  }

  function isEnabled() {
    return worldMapEnabled;
  }

  function resize() {
    worldMap?.resize();
  }

  // "Đến TechnoPark" khi bản đồ đang mở → canh lại tâm bản đồ về TechnoPark (camera 3D do
  // runtime xử lý nhánh còn lại). Tự bảo vệ nếu map chưa sẵn sàng.
  function flyToTechnopark() {
    if (!worldMapEnabled || !worldMap) return;
    worldMap.flyTo({
      center: [WORLD_MAP_TECHNOPARK_LON, WORLD_MAP_TECHNOPARK_LAT],
      zoom: WORLD_MAP_DETAIL_ZOOM,
      pitch: WORLD_MAP_DETAIL_PITCH,
    });
  }

  function dispose() {
    worldMapEnabled = false;
    try { worldMapRenderer?.dispose(); } catch (_) { /* GL context đã hủy */ }
    worldMapRenderer = null;
    try { worldMap?.remove(); } catch (_) { /* map đã hủy */ }
    worldMap = null;
    worldMapEl?.remove();
    worldMapEl = null;
    worldMapLayerAdded = false;
    worldMapModelMatrix = null;
    if (typeof window !== 'undefined') window.__smartcityWorldMap = null;
  }

  return { setMode, isEnabled, resize, dispose, flyToTechnopark };
}
