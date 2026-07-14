// Tầng service giữa data và render của stadium (Phase 6 CLEANUP_PLAN.md).
// Hydration chỉ gọi getData/subscribe; provider quyết định nguồn thật sự.
// Domain 'security' gộp interior/exterior/legend; 'reports' đọc từ
// stadium-report-store (store cục bộ có thể thay đổi khi gửi báo cáo).
import { dataConfig } from './data-config.js';
import { overviewHud } from '../data/stadium-overview-hud-data.js';
import { securityHud } from '../data/stadium-security-hud-data.js';
import { securityExteriorHud, SECURITY_LEGEND } from '../data/security-exterior-hud.js';
import { eventsHud } from '../data/stadium-events-hud-data.js';
import { facilitiesHud } from '../data/stadium-facilities-hud-data.js';
import { servicesHud } from '../data/stadium-services-hud-data.js';
import { getReportsData } from '../data/stadium-report-store.js';

const mockByDomain = {
  overview: overviewHud,
  security: { interior: securityHud, exterior: securityExteriorHud, legend: SECURITY_LEGEND },
  events: eventsHud,
  facilities: facilitiesHud,
  services: servicesHud,
};

const MockProvider = {
  async getData(domain) {
    if (domain === 'reports') return getReportsData();
    return mockByDomain[domain];
  },
  // Mock là dữ liệu tĩnh — không phát cập nhật nào sau snapshot đầu.
  subscribe() {
    return () => {};
  },
};

const RestProvider = {
  async getData(domain) {
    const res = await fetch(`${dataConfig.restBaseUrl}/${domain}`);
    if (!res.ok) throw new Error(`data-service: ${res.status} khi fetch ${domain}`);
    return res.json();
  },
  subscribe() {
    return () => {};
  },
};

const StreamProvider = {
  getData(domain) {
    return RestProvider.getData(domain);
  },
  subscribe(domain, onData) {
    const ws = new WebSocket(dataConfig.streamUrl);
    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.domain === domain && msg.data) onData(msg.data);
      } catch (err) {
        console.error('data-service: message stream không hợp lệ', err);
      }
    });
    return () => ws.close();
  },
};

const providers = { mock: MockProvider, rest: RestProvider, stream: StreamProvider };
const provider = providers[dataConfig.provider] || MockProvider;

// Trả về Promise<data> cho một domain ('overview' | 'security' | ... | 'reports').
export function getData(domain) {
  return provider.getData(domain);
}

// Gọi onData(data) mỗi khi domain có dữ liệu mới; trả về hàm unsubscribe.
export function subscribe(domain, onData) {
  return provider.subscribe(domain, onData);
}
