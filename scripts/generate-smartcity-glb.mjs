import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createCanvas, ImageData } from 'canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'smartcity-ioc', 'assets', 'models', 'smartcity');
const canvasPrototype = createCanvas(1, 1);

globalThis.ImageData = ImageData;
globalThis.HTMLCanvasElement = canvasPrototype.constructor;
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') return {};
    const canvas = createCanvas(128, 256);
    canvas.convertToBlob = ({ type = 'image/png' } = {}) => Promise.resolve(
      new Blob(
        [canvas.toBuffer(type === 'image/jpeg' ? 'image/jpeg' : 'image/png', { quality: 0.9 })],
        { type },
      ),
    );
    return canvas;
  },
  createElementNS(_namespace, tag) {
    return this.createElement(tag);
  },
};

function countGeometry(root) {
  let meshes = 0;
  let triangles = 0;
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry) return;
    meshes += 1;
    const index = object.geometry.index;
    triangles += index
      ? index.count / 3
      : object.geometry.attributes.position.count / 3;
  });
  return { meshes, triangles: Math.floor(triangles) };
}

function exportGlb(root) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(Buffer.from(result));
        else reject(new Error('Expected binary GLB output'));
      },
      reject,
      {
        binary: true,
        embedImages: true,
        onlyVisible: true,
      },
    );
  });
}

async function main() {
  const { buildSmartcityStaticGroups } = await import(
    '../smartcity-ioc/assets/js/scene/smartcity-static-scene.js'
  );
  const groups = buildSmartcityStaticGroups();
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [name, group] of Object.entries(groups)) {
    const scene = new THREE.Scene();
    scene.name = `SmartCity_${name}`;
    scene.add(group);
    const stats = countGeometry(scene);
    const buffer = await exportGlb(scene);
    const outputPath = path.join(outputDir, `${name}.glb`);
    fs.writeFileSync(outputPath, buffer);
    console.log(
      `${name}.glb: ${stats.meshes} meshes, ${stats.triangles.toLocaleString()} triangles, `
      + `${(buffer.length / 1024).toFixed(1)} KB`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
