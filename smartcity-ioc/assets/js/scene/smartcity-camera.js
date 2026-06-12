import * as THREE from 'three';
import { smartcitySceneData } from '../data/smartcity-scene-data.js';

const tweenTokens = new WeakMap();
const tweenControlStates = new WeakMap();

function nextTweenToken(camera) {
  const token = (tweenTokens.get(camera) || 0) + 1;
  tweenTokens.set(camera, token);
  return token;
}

export function cancelCameraTween(camera) {
  if (!camera) return;
  nextTweenToken(camera);
}

export function isCameraTweening(controls) {
  return tweenControlStates.has(controls);
}

function smoothstepQuintic(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function shortestAngleDelta(from, to) {
  return THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
}

function beginCameraTransition(controls) {
  if (!tweenControlStates.has(controls)) {
    tweenControlStates.set(controls, {
      enabled: controls.enabled,
    });
  }
  controls.enabled = false;
}

function endCameraTransition(controls) {
  const state = tweenControlStates.get(controls);
  if (!state) return;
  controls.enabled = state.enabled;
  tweenControlStates.delete(controls);
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
  const isSecurityTransition = pageId === 'security';
  const transitionDuration = isSecurityTransition ? Math.max(duration, 1350) : Math.max(duration, 1050);
  const token = nextTweenToken(camera);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(...preset.pos);
  const endTarget = new THREE.Vector3(...preset.target);
  const startOrbit = new THREE.Spherical().setFromVector3(startPos.clone().sub(startTarget));
  const endOrbit = new THREE.Spherical().setFromVector3(endPos.clone().sub(endTarget));
  const thetaDelta = shortestAngleDelta(startOrbit.theta, endOrbit.theta);
  const startFov = camera.fov;
  const endFov = preset.fov ?? startFov;
  const t0 = performance.now();
  beginCameraTransition(controls);

  return new Promise((resolve) => {
    function step(now) {
      if (tweenTokens.get(camera) !== token) {
        resolve(null);
        return;
      }
      const t = Math.min(1, (now - t0) / transitionDuration);
      const e = smoothstepQuintic(t);
      controls.target.lerpVectors(startTarget, endTarget, e);

      const pullback = isSecurityTransition ? 10 : 5;
      const orbit = new THREE.Spherical(
        THREE.MathUtils.lerp(startOrbit.radius, endOrbit.radius, e) + Math.sin(Math.PI * e) * pullback,
        THREE.MathUtils.lerp(startOrbit.phi, endOrbit.phi, e),
        startOrbit.theta + thetaDelta * e,
      );
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));

      camera.fov = startFov + (endFov - startFov) * e;
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      if (t < 1) requestAnimationFrame(step);
      else {
        camera.position.copy(endPos);
        controls.target.copy(endTarget);
        camera.fov = endFov;
        camera.updateProjectionMatrix();
        camera.lookAt(controls.target);
        endCameraTransition(controls);
        resolve(preset.hint);
      }
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
