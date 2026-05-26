import * as THREE from 'three';
import { stadiumSceneData } from '../data/stadium-scene.js';

export function applyCameraPreset(camera, controls, pageId) {
  const preset = stadiumSceneData.cameraPresets[pageId];
  if (!preset) return null;
  camera.position.set(...preset.pos);
  controls.target.set(...preset.target);
  controls.update();
  return preset.hint;
}

export function tweenCamera(camera, controls, pageId, duration = 900) {
  const preset = stadiumSceneData.cameraPresets[pageId];
  if (!preset) return Promise.resolve(null);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(...preset.pos);
  const endTarget = new THREE.Vector3(...preset.target);
  const t0 = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const e = t * t * (3 - 2 * t);
      camera.position.lerpVectors(startPos, endPos, e);
      controls.target.lerpVectors(startTarget, endTarget, e);
      controls.update();
      if (t < 1) requestAnimationFrame(step);
      else resolve(preset.hint);
    }
    requestAnimationFrame(step);
  });
}

export function setSceneHint(container, text) {
  const el = container?.querySelector('.map-scene-hint');
  if (el && text) el.textContent = `Kéo chuột xoay · Cuộn zoom · ${text}`;
}

export function showSceneLoading(container, on) {
  let el = container?.querySelector('.scene-loading');
  if (on && !el && container) {
    el = document.createElement('div');
    el.className = 'scene-loading';
    el.innerHTML = '<span class="scene-loading__spin"></span>Đang tải PVF Stadium 3D…';
    container.appendChild(el);
  } else if (!on && el) {
    el.remove();
  }
}
