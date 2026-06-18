import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2] || 'export';
const blendPath = path.join(root, 'smartcity-ioc', 'assets', 'blender', 'smartcity-master.blend');
const createScript = path.join(root, 'scripts', 'blender', 'create_smartcity_master.py');
const exportScript = path.join(root, 'scripts', 'blender', 'export_smartcity_to_web.py');
const validateScript = path.join(root, 'scripts', 'blender', 'validate_smartcity_blend.py');

function findBlender() {
  const configured = process.env.BLENDER_PATH;
  if (configured && fs.existsSync(configured)) return configured;

  if (process.platform === 'win32') {
    const foundation = 'C:\\Program Files\\Blender Foundation';
    if (fs.existsSync(foundation)) {
      const candidates = fs.readdirSync(foundation)
        .map((folder) => path.join(foundation, folder, 'blender.exe'))
        .filter((candidate) => fs.existsSync(candidate))
        .sort()
        .reverse();
      if (candidates.length) return candidates[0];
    }
  }

  return 'blender';
}

const blender = findBlender();
let args;

if (command === 'create') {
  args = ['--background', '--factory-startup', '--python-exit-code', '1', '--python', createScript];
} else if (command === 'export') {
  if (!fs.existsSync(blendPath)) {
    throw new Error(`Missing ${blendPath}. Run npm.cmd run blender:smartcity:create first.`);
  }
  args = ['--background', blendPath, '--python-exit-code', '1', '--python', exportScript];
} else if (command === 'validate') {
  if (!fs.existsSync(blendPath)) {
    throw new Error(`Missing ${blendPath}. Run npm.cmd run blender:smartcity:create first.`);
  }
  args = ['--background', blendPath, '--python-exit-code', '1', '--python', validateScript];
} else {
  throw new Error(`Unknown command: ${command}`);
}

const result = spawnSync(blender, args, {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
