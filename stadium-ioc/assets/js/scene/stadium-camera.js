import * as THREE from 'three';
import { stadiumSceneData } from '../data/stadium-scene-data.js';

const tweenTokens = new WeakMap();

function nextTweenToken(camera) {
  const token = (tweenTokens.get(camera) || 0) + 1;
  tweenTokens.set(camera, token);
  return token;
}

export function cancelCameraTween(camera) {
  if (!camera) return;
  nextTweenToken(camera);
}

export function applyCameraPreset(camera, controls, pageId) {
  const preset = stadiumSceneData.cameraPresets[pageId];
  if (!preset) return null;
  cancelCameraTween(camera);
  camera.position.set(...preset.pos);
  controls.target.set(...preset.target);
  if (preset.fov) {
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
  }
  controls.update();
  return preset.hint;
}

export function tweenCamera(camera, controls, pageId, duration = 900) {
  const preset = stadiumSceneData.cameraPresets[pageId];
  if (!preset) return Promise.resolve(null);
  const startFov = camera.fov;
  const endFov = preset.fov ?? startFov;
  return tweenCameraVectors(
    camera, controls,
    new THREE.Vector3(...preset.pos),
    new THREE.Vector3(...preset.target),
    duration,
    startFov,
    endFov,
  ).then((completed) => (completed ? preset.hint : null));
}

export function tweenCameraVectors(camera, controls, endPos, endTarget, duration = 900, startFov = null, endFov = null) {
  const token = nextTweenToken(camera);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const fov0 = startFov ?? camera.fov;
  const fov1 = endFov ?? fov0;
  const t0 = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      if (tweenTokens.get(camera) !== token) {
        resolve(false);
        return;
      }
      const t = Math.min(1, (now - t0) / duration);
      const e = t * t * (3 - 2 * t);
      camera.position.lerpVectors(startPos, endPos, e);
      controls.target.lerpVectors(startTarget, endTarget, e);
      if (startFov !== null || endFov !== null) {
        camera.fov = fov0 + (fov1 - fov0) * e;
        camera.updateProjectionMatrix();
      }
      controls.update();
      if (t < 1) requestAnimationFrame(step);
      else resolve(true);
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
