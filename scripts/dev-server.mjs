import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 3457;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.ico': 'image/x-icon',
};

const server = http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/stadium-ioc/stadium-index.html';
    if (urlPath === '/smartcity-ioc/index.html') urlPath = '/smartcity-ioc/smartcity-index.html';
    if (urlPath === '/stadium-ioc/index.html') urlPath = '/stadium-ioc/stadium-index.html';
    const filePath = path.normalize(path.join(root, urlPath.replace(/^\//, '').replace(/\//g, path.sep)));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`http://localhost:${port}/smartcity-ioc/smartcity-index.html`);
    console.log(`http://localhost:${port}/stadium-ioc/stadium-index.html`);
  });

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT=3458 or run npm.cmd run dev:check.`);
    process.exit(1);
  }
  throw err;
});
