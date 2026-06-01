import http from 'node:http';

const port = Number(process.env.PORT) || 3457;
const urls = [
  `http://localhost:${port}/`,
  `http://localhost:${port}/stadium-ioc/stadium-index.html`,
  `http://localhost:${port}/smartcity-ioc/smartcity-index.html`,
];

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ url, ok: Boolean(res.statusCode && res.statusCode < 500), status: res.statusCode });
    });
    req.on('error', (err) => resolve({ url, ok: false, error: err.message }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ url, ok: false, error: 'timeout' });
    });
  });
}

const results = await Promise.all(urls.map(check));
for (const result of results) {
  const state = result.ok ? 'OK' : 'FAIL';
  const detail = result.status ? result.status : result.error;
  console.log(`${state} ${detail} ${result.url}`);
}

if (results.some((result) => !result.ok)) process.exit(1);
