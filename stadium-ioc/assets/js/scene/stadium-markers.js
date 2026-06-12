import * as THREE from 'three';

const markerGroup = new THREE.Group();
markerGroup.name = 'ioc_markers';

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 40;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(4, 12, 24, 0.82)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 120, 32, 5);
  ctx.fill();
  ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '700 14px Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 20);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(8, 2.5, 1);
  sp.position.y = 4;
  return sp;
}

export function getMarkerGroup() {
  markerGroup.frustumCulled = false;
  return markerGroup;
}

export function clearMarkers() {
  while (markerGroup.children.length) {
    const ch = markerGroup.children[0];
    ch.traverse((o) => {
      if (o.material?.map) o.material.map.dispose();
      o.material?.dispose();
      o.geometry?.dispose();
    });
    markerGroup.remove(ch);
  }
}

export function setMarkers(items) {
  clearMarkers();
  items.forEach((m) => {
    const g = new THREE.Group();
    g.position.set(m.pos[0], m.pos[1], m.pos[2]);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 12),
      new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.9 }),
    );
    g.add(orb);
    g.add(makeLabel(m.label, m.color));
    markerGroup.add(g);
  });
}

export function pulseMarkers(time) {
  markerGroup.children.forEach((g, i) => {
    const s = 0.85 + Math.sin(time * 2.5 + i) * 0.15;
    g.scale.setScalar(s);
  });
}
