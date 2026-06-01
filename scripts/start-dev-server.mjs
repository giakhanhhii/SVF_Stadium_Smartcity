import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = path.join(root, '.tools');
const pidFile = path.join(toolsDir, 'dev-server.pid');
const outFile = path.join(root, 'server-out.log');
const errFile = path.join(root, 'server-err.log');
const port = Number(process.env.PORT) || 3457;
const url = `http://localhost:${port}/stadium-ioc/stadium-index.html`;

function waitForServer(timeoutMs = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve(res.statusCode);
        else retry();
      });
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Server did not respond at ${url}`));
        return;
      }
      setTimeout(probe, 300);
    };
    probe();
  });
}

async function alreadyRunning() {
  try {
    await waitForServer(1200);
    return true;
  } catch {
    return false;
  }
}

if (await alreadyRunning()) {
  console.log(`Website already running: ${url}`);
  process.exit(0);
}

fs.mkdirSync(toolsDir, { recursive: true });
const out = fs.openSync(outFile, 'a');
const err = fs.openSync(errFile, 'a');
const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
  cwd: root,
  detached: true,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', out, err],
  windowsHide: true,
});

child.unref();
fs.writeFileSync(pidFile, `${child.pid}\n`, 'utf8');

try {
  await waitForServer();
  console.log(`Website running: ${url}`);
  console.log(`PID ${child.pid} written to ${path.relative(root, pidFile)}`);
} catch (err) {
  console.error(err.message);
  console.error(`See ${path.relative(root, errFile)} for details.`);
  process.exit(1);
}
