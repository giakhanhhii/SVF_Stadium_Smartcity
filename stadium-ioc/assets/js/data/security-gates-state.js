const INITIAL_GATES = [
  { id: 'A1', open: true },
  { id: 'A2', open: true },
  { id: 'A3', open: true },
  { id: 'A4', open: true },
  { id: 'B1', open: true },
  { id: 'B2', open: false },
  { id: 'B3', open: true },
  { id: 'B4', open: true },
];

let gateState = INITIAL_GATES.map((gate) => ({ ...gate }));
const listeners = new Set();

function emit() {
  const snapshot = getGateState();
  listeners.forEach((listener) => listener(snapshot));
}

export function getGateState() {
  return gateState.map((gate) => ({ ...gate }));
}

export function getGateById(id) {
  return gateState.find((gate) => gate.id === id) || null;
}

export function subscribeGateState(listener) {
  listeners.add(listener);
  listener(getGateState());
  return () => listeners.delete(listener);
}

export function setGateOpen(id, open) {
  let changed = false;
  gateState = gateState.map((gate) => {
    if (gate.id !== id || gate.open === open) return gate;
    changed = true;
    return { ...gate, open };
  });
  if (changed) emit();
  return getGateById(id);
}

export function toggleGate(id) {
  const gate = getGateById(id);
  if (!gate) return null;
  return setGateOpen(id, !gate.open);
}

export function resetGateState() {
  gateState = INITIAL_GATES.map((gate) => ({ ...gate }));
  emit();
}

export function getGateSummary() {
  const openCount = gateState.filter((gate) => gate.open).length;
  return `${openCount}/${gateState.length}`;
}
