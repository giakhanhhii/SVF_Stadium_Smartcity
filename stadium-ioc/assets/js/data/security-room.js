import { securityHud } from './security-hud.js';
import { getGateState, getGateSummary } from './security-gates-state.js';

export const securityRoomData = {
  status: {
    camerasOnline: '46/48',
    gatesActive: getGateSummary(),
    crowdTotal: securityHud.left.crowd.total,
    hotZone: securityHud.right.zones.status,
  },
  cameras: securityHud.left.cameras.feeds.map((f, i) => ({
    id: `cam-${i}`,
    label: f.label,
    online: i !== 2,
  })),
  gates: getGateState(),
  actions: securityHud.right.zones.lanes.map((label, i) => ({
    id: `act-${i}`,
    label,
    icon: ['ti-door', 'ti-walk', 'ti-speakerphone'][i] || 'ti-bolt',
  })),
  alerts: securityHud.right.alerts.map((a, i) => ({ id: `alert-${i}`, ...a, ack: false })),
  modeTabs: securityHud.left.modeTabs,
};
