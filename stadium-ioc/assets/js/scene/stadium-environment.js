import * as THREE from 'three';

function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5eb0e8');
  grad.addColorStop(0.55, '#8ec8ef');
  grad.addColorStop(1, '#c8dce8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  [[80, 90, 120, 28], [280, 70, 90, 22], [400, 130, 70, 18], [150, 180, 100, 20]].forEach(([x, y, w, h]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addMountains(scene) {
  const g = new THREE.Group();
  g.name = 'backdrop_mountains';
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a9cb8, roughness: 0.95, fog: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const w = 80 + (i % 3) * 40;
    const h = 35 + (i % 4) * 18;
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(w, h, 4), mat);
    mesh.position.set(Math.sin(a) * 680, h * 0.35 - 8, Math.cos(a) * 680);
    mesh.rotation.y = a + Math.PI;
    g.add(mesh);
  }
  scene.add(g);
}

function addCitySilhouette(scene) {
  const g = new THREE.Group();
  g.name = 'backdrop_city';
  const mat = new THREE.MeshStandardMaterial({ color: 0x8898a8, roughness: 0.9, fog: true });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const h = 12 + (i % 5) * 8;
    const w = 8 + (i % 3) * 4;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    mesh.position.set(Math.sin(a) * 540, h / 2 - 4, Math.cos(a) * 540);
    g.add(mesh);
  }
  scene.add(g);
}

export function setupStadiumEnvironment(scene) {
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xb0cce4, 220, 820);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(620, 48),
    new THREE.MeshStandardMaterial({ color: 0x5a9e5e, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.name = 'env_ground';
  scene.add(ground);

  addMountains(scene);
  addCitySilhouette(scene);
}

export function disposeStadiumEnvironment(scene) {
  scene.traverse((obj) => {
    if (obj.name?.startsWith('backdrop_') || obj.name === 'env_ground') {
      obj.geometry?.dispose();
      obj.material?.dispose();
    }
  });
  if (scene.background?.dispose) scene.background.dispose();
}
