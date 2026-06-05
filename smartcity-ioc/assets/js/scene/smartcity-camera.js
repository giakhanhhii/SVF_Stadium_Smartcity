import * as THREE from 'three';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';

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
  const preset = smartcitySceneData.cameraPresets[pageId] || smartcitySceneData.cameraPresets.overview;
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

export function tweenCamera(camera, controls, pageId, duration = 850) {
  const preset = smartcitySceneData.cameraPresets[pageId] || smartcitySceneData.cameraPresets.overview;
  if (!preset) return Promise.resolve(null);
  const token = nextTweenToken(camera);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(...preset.pos);
  const endTarget = new THREE.Vector3(...preset.target);
  const startFov = camera.fov;
  const endFov = preset.fov ?? startFov;
  const t0 = performance.now();

  return new Promise((resolve) => {
    function step(now) {
      if (tweenTokens.get(camera) !== token) {
        resolve(null);
        return;
      }
      const t = Math.min(1, (now - t0) / duration);
      const e = t * t * (3 - 2 * t);
      camera.position.lerpVectors(startPos, endPos, e);
      controls.target.lerpVectors(startTarget, endTarget, e);
      camera.fov = startFov + (endFov - startFov) * e;
      camera.updateProjectionMatrix();
      controls.update();
      if (t < 1) requestAnimationFrame(step);
      else resolve(preset.hint);
    }
    requestAnimationFrame(step);
  });
}

export function setSceneHint(container, text) {
  const el = container?.querySelector('.map-scene-hint');
  if (el && text) el.textContent = `Kéo chuột xoay · Cuộn để zoom · ${text}`;
}

export function showSceneLoading(container, on) {
  let el = container?.querySelector('.scene-loading');
  if (on && !el && container) {
    el = document.createElement('div');
    el.className = 'scene-loading';
    el.innerHTML = '<span class="scene-loading__spin"></span>Đang tải mô hình Smart City 3D...';
    container.appendChild(el);
  } else if (!on && el) {
    el.remove();
  }
}
