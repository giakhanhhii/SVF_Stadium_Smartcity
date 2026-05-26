/** Mock data cho mô hình 3D khu đô thị — trang An ninh */
export const buildingSceneData = {
  water: { pos: [0, 0, 0], size: [16, 20] },
  island: { pos: [0, 0, 0], radius: 1.4 },
  buildings: [
    { id: 'A1', label: 'T1', name: 'Tòa Trung tâm', pos: [-6.5, 0, -5], size: [3.5, 17, 3.2], color: '#eef1f5', accent: '#e85a4f', roof: true },
    { id: 'B2', label: 'T2', name: 'Tháp B', pos: [-1.5, 0, -7], size: [4.2, 13, 3.5], color: '#f4f6f8', accent: '#2bb8a8', roof: true },
    { id: 'B3', label: 'T3', name: 'Tháp C', pos: [4, 0, -6], size: [3.8, 15, 3], color: '#eceff3', accent: '#4a90d9', roof: true },
    { id: 'C2', label: 'T4', name: 'Nhà kho C2', pos: [7.5, 0, 1], size: [3, 9, 4.5], color: '#e8eaee', incident: true },
    { id: 'D7', label: 'T5', name: 'Block D', pos: [-5.5, 0, 6], size: [5.5, 10, 3], color: '#f0f2f5', accent: '#f0a030', roof: true },
  ],
  skybridges: [
    { pos: [-3.8, 10.5, -6.2], size: [5.5, 0.35, 1.3] },
    { pos: [1.2, 9, -6], size: [4.5, 0.35, 1.1] },
    { pos: [-1, 11.5, -2], size: [1.2, 0.35, 4] },
  ],
  cameras: [
    { id: 'Camera17', pos: [-5.8, 17.5, -4], buildingId: 'A1' },
    { id: 'Camera22', pos: [0, 13.5, -6.5], buildingId: 'B2' },
    { id: 'Camera08', pos: [-4, 10.5, 6.5], buildingId: 'D7' },
    { id: 'Camera31', pos: [8, 9.5, 2], buildingId: 'C2' },
    { id: 'Camera05', pos: [4.5, 15.5, -5], buildingId: 'B3' },
    { id: 'Camera12', pos: [-2, 12, -1], buildingId: 'B2' },
  ],
  markers: [
    { type: 'incident', pos: [8, 9.5, 2.5], color: '#E24B4A', label: 'Sự cố C2' },
    { type: 'team', pos: [2, 0.8, 3], color: '#1D9E75', label: 'Đội #03' },
  ],
  trees: [
    [-9, 3], [9, -4], [-8, 8], [10, 7], [-10, -4], [11, 2],
    [0.8, 0.5], [-0.6, -0.4], [0.3, -0.8],
  ],
  grassPatches: [
    [-6.5, -2], [4, -3], [-4, 7], [7, 5], [-8, 6],
  ],
};
