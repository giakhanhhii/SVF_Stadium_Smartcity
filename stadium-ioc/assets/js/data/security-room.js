import { securityHud } from './security-hud.js';

export const securityRoomData = {
  status: {
    camerasOnline: '46/48',
    gatesActive: securityHud.left.gates.value,
    crowdTotal: securityHud.left.crowd.total,
    hotZone: securityHud.right.zones.status,
  },
  cameras: securityHud.left.cameras.feeds.map((f, i) => ({
    id: `cam-${i}`,
    label: f.label,
    online: i !== 2,
  })),
  gates: [
    { id: 'A1', open: true }, { id: 'A2', open: true }, { id: 'A3', open: true }, { id: 'A4', open: true },
    { id: 'B1', open: true }, { id: 'B2', open: false }, { id: 'B3', open: true }, { id: 'B4', open: true },
  ],
  actions: securityHud.right.zones.lanes.map((label, i) => ({
    id: `act-${i}`,
    label,
    icon: ['ti-door', 'ti-walk', 'ti-speakerphone'][i] || 'ti-bolt',
  })),
  alerts: securityHud.right.alerts.map((a, i) => ({ id: `alert-${i}`, ...a, ack: false })),
  modeTabs: securityHud.left.modeTabs,
};
