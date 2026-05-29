import { securityHud } from './stadium-security-hud-data.js';
import { getGateState, getGateSummary } from './security-gates-state.js';

const liveZone = securityHud.right.zones.views.live;

export const securityRoomData = {
  status: {
    camerasOnline: '46/48',
    gatesActive: getGateSummary(),
    crowdTotal: securityHud.left.crowd.total,
    hotZone: liveZone.status,
  },
  cameras: securityHud.left.cameras.feeds.map((f, i) => ({
    id: `cam-${i}`,
    label: f.label,
    online: i !== 2,
  })),
  gates: getGateState(),
  actions: liveZone.lanes.map((label, i) => ({
    id: `act-${i}`,
    label,
    icon: ['ti-door', 'ti-walk', 'ti-speakerphone'][i] || 'ti-bolt',
  })),
  alerts: securityHud.right.alerts.map((a, i) => ({ id: `alert-${i}`, ...a, ack: false })),
  modeTabs: securityHud.left.modeTabs,
};
