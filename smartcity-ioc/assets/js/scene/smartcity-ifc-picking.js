import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PIPE_FOOTPRINT_UNITS = 112; // bề rộng mục tiêu của mạng đường ống dưới thành phố
const PIPE_TOP_DEPTH = 0.6; // đỉnh mạng ống nằm dưới mặt đất ~0.6 đơn vị
const DRACO_DECODER_PATH = 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/';

// Factory: mỗi cảnh tạo 1 controller sở hữu state mạng đường ống ngầm + tòa TecnoPark trong
// closure (group, vật liệu, ifc_map, mesh tô sáng, cleanup listener). Picking từng phần tử
// IFC → phát sự kiện smartcity-pipe-pick / smartcity-tecnopark-pick kèm IOC info cho panel.
// - getCityReveal(): đọc mức reveal hiện tại của runtime (chỉ cho bấm ống khi đã lộ ống).
// - urls: các URL GLB/json đã gắn version (runtime giữ SMARTCITY_MODEL_VERSION single-source).
//   { pipesGlb, pipesIfcMap, technoparkGlb, technoparkIfcMap, technoparkTransform }
export function createIfcPicking({ getCityReveal, urls }) {
  let pipeGroup = null;
  let pipeMaterials = []; // các vật liệu gốc của mạng ống (giữ màu Blender), fade theo reveal
  let pipeIfcMap = null; // ifc_map.json: { faceAttribute, chunks: { key: [entries] } }
  let pipeHighlight = null; // mesh tô sáng phần tử đang chọn
  let pipePickCleanup = null; // gỡ listener click chọn đường ống

  let technoparkGroup = null;
  let technoparkIfcMap = null; // { faceAttribute, chunks: { key: [entries] } }
  let technoparkHighlight = null; // mesh tô sáng phần tử đang chọn
  let technoparkPickCleanup = null; // gỡ listener click chọn tòa TecnoPark

  // Tải mạng đường ống ngầm từ pipes.glb (xuất từ twin.blend), tự canh giữa + co giãn
  // để vừa khuôn thành phố rồi hạ xuống dưới mặt đất. Tô lại màu xanh nước biển và bắt
  // đầu ở trạng thái ẩn (opacity 0) — chỉ hiện dần khi kéo thanh trượt "Hiện đường ống".
  async function loadPipeNetwork(scene, loader) {
    try {
      const [gltf] = await Promise.all([
        loader.loadAsync(urls.pipesGlb),
        loadPipeIfcMap(),
      ]);
      const inner = gltf.scene;
      // pipes.glb xuất từ Blender giữ trục Z-up → xoay -90° quanh X để nằm phẳng (Y-up).
      inner.rotation.x = -Math.PI / 2;
      inner.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(inner);
      if (box.isEmpty()) return;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Sau khi xoay phẳng: X/Z là mặt bằng, Y là bề dày (mỏng) → fit theo X/Z.
      const span = Math.max(size.x, size.z) || 1;
      const scale = PIPE_FOOTPRINT_UNITS / span;

      // Đưa tâm hình học về gốc của group con để canh giữa + định vị quanh tâm.
      inner.position.sub(center);

      // Giữ NGUYÊN vật liệu/màu gốc xuất từ Blender (xanh nước biển / tím / xám)
      // thay vì ghi đè một màu duy nhất. pipes.glb (xuất từ FAST chunk) KHÔNG có
      // attribute normal → MeshStandardMaterial không tính được ánh sáng và bị
      // tô đen; nên tự tính normal cho từng mesh. Bật trong suốt + emissive nhẹ
      // theo chính màu vật liệu để màu luôn hiện rõ dưới lòng đất.
      pipeMaterials = [];
      const seenPipeMaterials = new Set();
      inner.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        if (object.geometry && !object.geometry.getAttribute('normal')) {
          object.geometry.computeVertexNormals();
        }
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        mats.forEach((mat) => {
          if (!mat || seenPipeMaterials.has(mat)) return;
          seenPipeMaterials.add(mat);
          mat.transparent = true;
          mat.opacity = 0;
          mat.userData.baseOpacity = 1;
          if (mat.color && mat.emissive) {
            mat.emissive.copy(mat.color);
            mat.emissiveIntensity = 0.28;
          }
          mat.needsUpdate = true;
          pipeMaterials.push(mat);
        });
      });

      pipeGroup = new THREE.Group();
      pipeGroup.name = 'smartcity-pipes';
      pipeGroup.add(inner);
      pipeGroup.scale.setScalar(scale);
      // Hạ toàn bộ khối ống xuống ngay dưới mặt đất: đỉnh tại y = -PIPE_TOP_DEPTH.
      pipeGroup.position.y = -PIPE_TOP_DEPTH - (size.y * 0.5 * scale);
      pipeGroup.visible = false;
      scene.add(pipeGroup);
    } catch (error) {
      console.warn('[smartcity-scene] Chưa tải được pipes.glb (mạng đường ống).', error);
    }
  }

  // === Tòa TecnoPark =========================================================
  // Tải technopark.glb (nén Draco). GLB đã được xuất với yup + transform đã
  // "apply" trong Blender nên add thẳng vào gốc cảnh là khớp đúng vị trí (chỗ
  // trung tâm thương mại cũ). Tải kèm bản đồ IOC để bấm xem thông tin phần tử.
  async function loadTechnopark(scene) {
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      const [gltf, , transform] = await Promise.all([
        loader.loadAsync(urls.technoparkGlb),
        loadTechnoparkIfcMap(),
        fetch(urls.technoparkTransform).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      // Tòa nhà rất nặng: 3605 mesh (1128 mesh kính MeshPhysicalMaterial trong suốt)
      // → vừa nặng vật liệu vừa nhiều draw-call. Ở web ta:
      //   (1) đổi sang MeshLambertMaterial phẳng, ĐỤC — giống Solid của Blender, nhẹ;
      //   (2) GỘP hình học theo vật liệu (3605 → ~20 mesh) để giảm draw-call → hết lag.
      // Vẫn bấm được từng phần tử nhờ _ifc_index (id TOÀN CỤC) tra vào danh sách phẳng.
      const liteCache = new Map();   // vật liệu PBR gốc -> Basic phẳng (giữ màu)
      const geomsByMat = new Map();  // vật liệu Basic -> [geometry, ...]
      // MeshBasicMaterial = không tính ánh sáng → nhẹ nhất, phẳng đúng như chế độ
      // Solid 'Flat' của Blender (GPU tích hợp Intel UHD đỡ tải nhất).
      const toLite = (src) => {
        if (liteCache.has(src)) return liteCache.get(src);
        const lite = new THREE.MeshBasicMaterial({
          color: src && src.color ? src.color.clone() : new THREE.Color(0x9bb7c7),
          side: src ? src.side : THREE.FrontSide,
          vertexColors: src ? src.vertexColors : false,
        });
        liteCache.set(src, lite);
        return lite;
      };
      const cleanGeo = (g) => {  // chỉ giữ thuộc tính cần để gộp đồng nhất
        let normal = g.getAttribute('normal');
        if (!normal) { g.computeVertexNormals(); normal = g.getAttribute('normal'); }
        const out = new THREE.BufferGeometry();
        out.setAttribute('position', g.getAttribute('position'));
        out.setAttribute('normal', normal);
        out.setAttribute('_ifc_index', g.getAttribute('_ifc_index'));
        if (g.index) out.setIndex(g.index);
        return out;
      };
      gltf.scene.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        if (!object.geometry.getAttribute('_ifc_index')) return;
        const src = Array.isArray(object.material) ? object.material[0] : object.material;
        const lite = toLite(src);
        if (!geomsByMat.has(lite)) geomsByMat.set(lite, []);
        geomsByMat.get(lite).push(cleanGeo(object.geometry));
      });
      const merged = new THREE.Group();
      merged.name = 'smartcity-technopark';
      let drawCalls = 0;
      for (const [mat, geos] of geomsByMat) {
        const mg = mergeGeometries(geos, false);
        geos.forEach((g) => g.dispose());
        if (!mg) continue;
        const mesh = new THREE.Mesh(mg, mat);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.matrixAutoUpdate = false;
        merged.add(mesh);
        drawCalls += 1;
      }
      // Áp ma trận đặt chỗ (đồng bộ từ Blender khi lưu) lên cả khối đã gộp.
      if (transform && Array.isArray(transform.matrix) && transform.matrix.length === 16) {
        merged.matrix.fromArray(transform.matrix);
        merged.matrix.decompose(merged.position, merged.quaternion, merged.scale);
      }
      // Giải phóng GLB gốc (mesh/vật liệu PBR nặng).
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry?.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => m?.dispose?.());
      });
      technoparkGroup = merged;
      scene.add(merged);
      merged.updateMatrixWorld(true);
      dracoLoader.dispose();
      console.info(`[smartcity-scene] TecnoPark gộp còn ${drawCalls} draw-call.`);
    } catch (error) {
      console.warn('[smartcity-scene] Chưa tải được technopark.glb (tòa TecnoPark).', error);
    }
  }

  async function loadTechnoparkIfcMap() {
    if (technoparkIfcMap) return technoparkIfcMap;
    try {
      const response = await fetch(urls.technoparkIfcMap);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      technoparkIfcMap = await response.json();
    } catch (error) {
      console.warn('[smartcity-scene] Chưa tải được technopark-ifc-map.json (IOC info).', error);
      technoparkIfcMap = null;
    }
    return technoparkIfcMap;
  }

  // Trả về { ifcIndex, entry, mesh } cho phần tử TecnoPark dưới con trỏ. Sau khi gộp
  // hình học, _ifc_index là id TOÀN CỤC tra thẳng vào danh sách phẳng elements[].
  function pickTechnoElement(ndc, camera) {
    if (!technoparkGroup || !technoparkGroup.visible) return null;
    const elements = technoparkIfcMap?.elements;
    if (!Array.isArray(elements)) return null;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(technoparkGroup, true);
    for (const hit of hits) {
      const mesh = hit.object;
      const attr = mesh.geometry?.getAttribute('_ifc_index');
      if (!attr || !hit.face) continue;
      const ifcIndex = Math.round(attr.getX(hit.face.a));
      const entry = elements[ifcIndex] || null;
      return { ifcIndex, entry, mesh };
    }
    return null;
  }

  // Tô sáng toàn bộ tam giác cùng ifc_index của phần tử vừa chọn.
  function highlightTechnoElement(mesh, ifcIndex) {
    clearTechnoHighlight();
    const geometry = mesh.geometry;
    const attr = geometry?.getAttribute('_ifc_index');
    const position = geometry?.getAttribute('position');
    if (!attr || !position) return;
    const index = geometry.getIndex();
    const triCount = index ? index.count : position.count;
    const verts = [];
    for (let i = 0; i < triCount; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
      if (Math.round(attr.getX(a)) !== ifcIndex) continue;
      verts.push(position.getX(a), position.getY(a), position.getZ(a));
      verts.push(position.getX(b), position.getY(b), position.getZ(b));
      verts.push(position.getX(c), position.getY(c), position.getZ(c));
    }
    if (!verts.length) return;
    const hlGeo = new THREE.BufferGeometry();
    hlGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    hlGeo.computeVertexNormals();
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.85,
      metalness: 0.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    technoparkHighlight = new THREE.Mesh(hlGeo, hlMat);
    technoparkHighlight.name = '__TECHNOPARK_HIGHLIGHT__';
    technoparkHighlight.renderOrder = 999;
    mesh.add(technoparkHighlight);
  }

  function clearTechnoHighlight() {
    if (technoparkHighlight) {
      technoparkHighlight.parent?.remove(technoparkHighlight);
      technoparkHighlight.geometry?.dispose();
      technoparkHighlight.material?.dispose();
      technoparkHighlight = null;
    }
  }

  // Bấm vào tòa TecnoPark → tô sáng phần tử + phát sự kiện kèm IOC info.
  function attachTechnoPicking(canvas, camera) {
    if (!canvas) return;
    let downX = 0;
    let downY = 0;
    const onPointerDown = (event) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const onPointerUp = (event) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      if (!technoparkGroup || !technoparkGroup.visible) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const picked = pickTechnoElement(ndc, camera);
      if (!picked || !picked.entry) {
        clearTechnoHighlight();
        window.dispatchEvent(new CustomEvent('smartcity-tecnopark-pick', { detail: null }));
        return;
      }
      highlightTechnoElement(picked.mesh, picked.ifcIndex);
      window.dispatchEvent(new CustomEvent('smartcity-tecnopark-pick', { detail: picked.entry }));
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    technoparkPickCleanup = () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      technoparkPickCleanup = null;
    };
  }

  async function loadPipeIfcMap() {
    if (pipeIfcMap) return pipeIfcMap;
    try {
      const response = await fetch(urls.pipesIfcMap);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      pipeIfcMap = await response.json();
    } catch (error) {
      console.warn('[smartcity-scene] Chưa tải được pipes-ifc-map.json (IOC info).', error);
      pipeIfcMap = null;
    }
    return pipeIfcMap;
  }

  // Trả về { chunkKey, ifcIndex, entry } cho phần tử IFC dưới con trỏ, hoặc null.
  function pickPipeElement(ndc, camera) {
    if (!pipeGroup || !pipeGroup.visible) return null;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(pipeGroup, true);
    for (const hit of hits) {
      const mesh = hit.object;
      const attr = mesh.geometry?.getAttribute('_ifc_index');
      if (!attr || !hit.face) continue;
      const ifcIndex = Math.round(attr.getX(hit.face.a));
      const chunkKey = mesh.name;
      const entries = pipeIfcMap?.chunks?.[chunkKey];
      const entry = Array.isArray(entries) ? entries[ifcIndex] : null;
      return { chunkKey, ifcIndex, entry, mesh };
    }
    return null;
  }

  // Tô sáng toàn bộ tam giác cùng ifc_index trong chunk vừa chọn (giống highlight Blender).
  function highlightPipeElement(mesh, ifcIndex) {
    clearPipeHighlight();
    const geometry = mesh.geometry;
    const attr = geometry?.getAttribute('_ifc_index');
    const position = geometry?.getAttribute('position');
    if (!attr || !position) return;
    const index = geometry.getIndex();
    const triCount = index ? index.count : position.count;
    const verts = [];
    for (let i = 0; i < triCount; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
      if (Math.round(attr.getX(a)) !== ifcIndex) continue;
      verts.push(position.getX(a), position.getY(a), position.getZ(a));
      verts.push(position.getX(b), position.getY(b), position.getZ(b));
      verts.push(position.getX(c), position.getY(c), position.getZ(c));
    }
    if (!verts.length) return;
    const hlGeo = new THREE.BufferGeometry();
    hlGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    hlGeo.computeVertexNormals();
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0x7df9ff,
      emissive: 0x32d6ff,
      emissiveIntensity: 0.9,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.96,
      depthTest: false,
    });
    pipeHighlight = new THREE.Mesh(hlGeo, hlMat);
    pipeHighlight.name = '__PIPE_HIGHLIGHT__';
    pipeHighlight.renderOrder = 999;
    // Đặt cùng hệ toạ độ với mesh chunk (mesh là con của inner, con của pipeGroup).
    mesh.add(pipeHighlight);
  }

  function clearPipeHighlight() {
    if (pipeHighlight) {
      pipeHighlight.parent?.remove(pipeHighlight);
      pipeHighlight.geometry?.dispose();
      pipeHighlight.material?.dispose();
      pipeHighlight = null;
    }
  }

  // Bấm vào mạng đường ống (khi đã hiện) → tô sáng phần tử + phát sự kiện kèm IOC info.
  // Phân biệt click với xoay camera bằng khoảng dịch chuột giữa pointerdown/up.
  function attachPipePicking(canvas, camera) {
    if (!canvas) return;
    let downX = 0;
    let downY = 0;
    const onPointerDown = (event) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const onPointerUp = (event) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      if (!pipeGroup || !pipeGroup.visible || getCityReveal() < 0.05) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const picked = pickPipeElement(ndc, camera);
      if (!picked) {
        clearPipeHighlight();
        window.dispatchEvent(new CustomEvent('smartcity-pipe-pick', { detail: null }));
        return;
      }
      highlightPipeElement(picked.mesh, picked.ifcIndex);
      window.dispatchEvent(new CustomEvent('smartcity-pipe-pick', { detail: picked.entry || null }));
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    pipePickCleanup = () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      pipePickCleanup = null;
    };
  }

  // Dọn state khi hủy cảnh (mirror đúng khối dispose cũ trong runtime).
  function dispose() {
    clearPipeHighlight();
    pipePickCleanup?.();
    pipeGroup = null;
    pipeMaterials = [];
    pipeIfcMap = null;
    clearTechnoHighlight();
    technoparkPickCleanup?.();
    technoparkGroup = null;
    technoparkIfcMap = null;
  }

  return {
    loadPipeNetwork,
    loadTechnopark,
    attachPipePicking,
    attachTechnoPicking,
    clearPipeHighlight,
    clearTechnoHighlight,
    getPipeGroup: () => pipeGroup,
    getPipeMaterials: () => pipeMaterials,
    dispose,
  };
}
