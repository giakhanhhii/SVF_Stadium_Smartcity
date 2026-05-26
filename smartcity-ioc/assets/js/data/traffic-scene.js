/** Mock data scene 3D giao thông — ngã tư */
export const trafficSceneData = {
  vehicles: [
    { type: 'car', color: '#c83838', x: -2.2, z: -14, rot: 0, axis: 'z', speed: 0.06, min: -18, max: 18 },
    { type: 'car', color: '#3860c8', x: 2.2, z: 16, rot: Math.PI, axis: 'z', speed: 0.055, min: -18, max: 18 },
    { type: 'car', color: '#e8e8e8', x: -14, z: -2.2, rot: Math.PI / 2, axis: 'x', speed: 0.05, min: -18, max: 18 },
    { type: 'car', color: '#2a2a2a', x: 15, z: 2.2, rot: -Math.PI / 2, axis: 'x', speed: 0.048, min: -18, max: 18 },
    { type: 'car', color: '#d4a030', x: -2.2, z: 8, rot: 0, axis: 'z', speed: 0.04, min: -18, max: 18 },
    { type: 'moto', color: '#222222', x: 2.2, z: -6, rot: 0, axis: 'z', speed: 0.07, min: -18, max: 18 },
    { type: 'moto', color: '#c02020', x: -2.2, z: 3, rot: Math.PI, axis: 'z', speed: 0.065, min: -18, max: 18 },
    { type: 'moto', color: '#1a1a1a', x: 8, z: 2.2, rot: -Math.PI / 2, axis: 'x', speed: 0.072, min: -18, max: 18 },
    { type: 'moto', color: '#444444', x: -10, z: -2.2, rot: Math.PI / 2, axis: 'x', speed: 0.068, min: -18, max: 18 },
  ],
  trafficLights: [
    { x: -5.5, z: -5.5, rot: 0 },
    { x: 5.5, z: -5.5, rot: Math.PI / 2 },
    { x: 5.5, z: 5.5, rot: Math.PI },
    { x: -5.5, z: 5.5, rot: -Math.PI / 2 },
  ],
};
