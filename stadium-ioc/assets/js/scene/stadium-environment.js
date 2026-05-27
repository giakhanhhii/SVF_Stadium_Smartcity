import * as THREE from 'three';

function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#4fa6e6');
  grad.addColorStop(0.52, '#77bceb');
  grad.addColorStop(1, '#d8ecfa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  [[80, 90, 120, 28], [280, 70, 90, 22], [400, 130, 70, 18], [150, 180, 100, 20]].forEach(([x, y, w, h]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addCitySilhouette(scene) {
  const g = new THREE.Group();
  g.name = 'backdrop_city';
  scene.add(g);
}

export function setupStadiumEnvironment(scene) {
  scene.background = makeSkyTexture();
  scene.fog = null;

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(920, 64),
    new THREE.MeshStandardMaterial({ color: 0x5a9e5e, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.name = 'env_ground';
  scene.add(ground);

  addCitySilhouette(scene);
}

export function disposeStadiumEnvironment(scene) {
  scene.traverse((obj) => {
    if (obj.name?.startsWith('backdrop_') || obj.name === 'env_ground') {
      obj.geometry?.dispose();
      obj.material?.dispose();
    }
  });
  scene.fog = null;
  if (scene.background?.dispose) scene.background.dispose();
}
