import { reportsData as baseReportsData } from './stadium-reports-data.js';

const STORAGE_KEY = 'stadium-ioc-operational-reports-v1';
const UPDATE_EVENT = 'stadium-report-history-updated';
const MAX_DYNAMIC_CASES = 40;

const clone = (value) => JSON.parse(JSON.stringify(value));

function readState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return { cases: [], overrides: {} };
    const state = JSON.parse(raw);
    return {
      cases: Array.isArray(state.cases) ? state.cases : [],
      overrides: state.overrides && typeof state.overrides === 'object' ? state.overrides : {},
    };
  } catch {
    return { cases: [], overrides: {} };
  }
}

function writeState(state) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The dashboard still works with in-memory render data if storage is unavailable.
  }
}

function notify() {
  document.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: getReportsData() }));
}

function caseTone(type, resolved, explicitTone) {
  if (explicitTone) return explicitTone;
  if (resolved) return 'ok';
  if (type === 'fire' || type === 'fire-risk') return 'danger';
  return 'warn';
}

function caseType(type = '') {
  if (['crowd', 'medical', 'power', 'fire', 'fire-risk', 'traffic'].includes(type)) return type;
  if (/pccc|fire|smoke|khói|cháy/i.test(type)) return 'fire';
  if (/power|điện|ups/i.test(type)) return 'power';
  if (/traffic|parking|giao/i.test(type)) return 'traffic';
  if (/medical|y tế|ems/i.test(type)) return 'medical';
  return 'crowd';
}

function createCaseId(now = new Date()) {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `BC-${yy}${mm}${dd}-${hh}${mi}${ss}`;
}

function caseToHistory(item) {
  return {
    id: item.id,
    title: item.title,
    time: item.time,
    status: item.status,
    tone: item.tone,
    source: item.source,
  };
}

function normalizeCase(payload = {}) {
  const now = new Date();
  const resolved = Boolean(payload.resolved);
  const type = caseType(payload.type || payload.tag || payload.title);
  return {
    id: payload.id || createCaseId(now),
    title: payload.title || 'Thao tác vận hành sân vận động',
    time: payload.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    status: payload.status || (resolved ? 'Đã xử lý' : 'Chưa giải quyết'),
    resolved,
    tone: caseTone(type, resolved, payload.tone),
    type,
    attempts: payload.attempts || 1,
    owner: payload.owner || 'Trưởng ca vận hành',
    summary: payload.summary || 'Thao tác vận hành đã được kích hoạt từ dashboard IOC sân vận động.',
    steps: Array.isArray(payload.steps) && payload.steps.length
      ? payload.steps
      : ['Ghi nhận thao tác từ dashboard', 'Chuyển người phụ trách xác nhận', 'Theo dõi trạng thái trong ca vận hành'],
    source: payload.source || 'Thao tác website',
    createdAt: payload.createdAt || now.toISOString(),
  };
}

export function getReportsData() {
  const state = readState();
  const dynamicCases = state.cases.map((item) => ({ ...item }));
  const baseCases = baseReportsData.reportCases.map((item) => ({
    ...clone(item),
    ...(state.overrides[item.id] || {}),
  }));
  const reportCases = [...dynamicCases, ...baseCases];
  return {
    ...baseReportsData,
    history: [
      ...dynamicCases.map(caseToHistory),
      ...baseReportsData.history.map((item) => ({ ...item })),
    ],
    reportCases,
  };
}

export function addOperationalReport(payload) {
  const item = normalizeCase(payload);
  const state = readState();
  state.cases = [item, ...state.cases].slice(0, MAX_DYNAMIC_CASES);
  writeState(state);
  notify();
  return item;
}

export function updateOperationalReport(id, patch = {}) {
  if (!id) return null;
  const state = readState();
  const dynamicIndex = state.cases.findIndex((item) => item.id === id);
  const normalizedPatch = { ...patch };
  if (normalizedPatch.resolved === true && !normalizedPatch.status) normalizedPatch.status = 'Đã xử lý';
  if (dynamicIndex >= 0) {
    state.cases[dynamicIndex] = {
      ...state.cases[dynamicIndex],
      ...normalizedPatch,
      tone: normalizedPatch.tone || caseTone(state.cases[dynamicIndex].type, normalizedPatch.resolved ?? state.cases[dynamicIndex].resolved),
    };
    writeState(state);
    notify();
    return state.cases[dynamicIndex];
  }
  state.overrides[id] = {
    ...(state.overrides[id] || {}),
    ...normalizedPatch,
  };
  writeState(state);
  notify();
  return state.overrides[id];
}
