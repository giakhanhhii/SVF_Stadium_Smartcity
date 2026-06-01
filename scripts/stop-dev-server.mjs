import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pidFile = path.join(root, '.tools', 'dev-server.pid');

if (!fs.existsSync(pidFile)) {
  console.log('No dev server PID file found.');
  process.exit(0);
}

const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
if (!Number.isInteger(pid) || pid <= 0) {
  fs.rmSync(pidFile, { force: true });
  console.log('Removed invalid dev server PID file.');
  process.exit(0);
}

try {
  process.kill(pid);
  console.log(`Stopped dev server PID ${pid}.`);
} catch (err) {
  if (err.code === 'ESRCH') console.log(`Dev server PID ${pid} is not running.`);
  else throw err;
} finally {
  fs.rmSync(pidFile, { force: true });
}
