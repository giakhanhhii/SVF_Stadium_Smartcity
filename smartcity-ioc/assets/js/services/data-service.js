// Tầng service giữa data và render (Phase 6 CLEANUP_PLAN.md).
// Hydration chỉ gọi getData/subscribe; provider quyết định nguồn thật sự.
// Mọi provider trả về object cùng shape với mock trong assets/js/data/*.js.
import { dataConfig } from './data-config.js';
import { overviewData } from '../data/smartcity-overview-data.js';
import { trafficData } from '../data/traffic.js';
import { securityData } from '../data/smartcity-security-data.js';
import { domainPanelsData } from '../data/smartcity-domain-panels-data.js';

const mockByDomain = {
  overview: overviewData,
  traffic: trafficData,
  security: securityData,
  environment: domainPanelsData.environment,
  utilities: domainPanelsData.utilities,
  reports: domainPanelsData.reports,
};

const MockProvider = {
  async getData(domain) {
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

// Trả về Promise<data> cho một domain ('overview' | 'traffic' | ... | 'reports').
export function getData(domain) {
  return provider.getData(domain);
}

// Gọi onData(data) mỗi khi domain có dữ liệu mới; trả về hàm unsubscribe.
export function subscribe(domain, onData) {
  return provider.subscribe(domain, onData);
}
