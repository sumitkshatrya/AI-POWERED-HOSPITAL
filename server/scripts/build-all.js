const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Starting Full Production Build ===');

// 1. Locate Client Directory
const possibleClientDirs = [
  path.resolve(__dirname, '../../client'),
  path.resolve(__dirname, '../client'),
  path.resolve(process.cwd(), '../client'),
  path.resolve(process.cwd(), 'client'),
];

const clientDir = possibleClientDirs.find((dir) =>
  fs.existsSync(dir) && fs.existsSync(path.join(dir, 'package.json'))
);

if (clientDir) {
  console.log(`[Build] Client directory detected at: ${clientDir}`);

  const clientNodeModules = path.join(clientDir, 'node_modules');
  if (!fs.existsSync(clientNodeModules) || process.env.RENDER || process.env.CI) {
    console.log('[Build] Installing client dependencies (npm install)...');
    execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
  }

  console.log('[Build] Compiling frontend client (npm run build)...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  console.log('[Build] Frontend client build completed successfully.');
} else {
  console.warn('[Build] Warning: Client directory not found. Skipping frontend build.');
}

// 2. Locate Server Directory & Compile TypeScript
const possibleServerDirs = [
  path.resolve(__dirname, '..'),
  path.resolve(process.cwd(), 'server'),
  process.cwd(),
];

const serverDir = possibleServerDirs.find((dir) =>
  fs.existsSync(dir) && fs.existsSync(path.join(dir, 'tsconfig.json'))
);

if (!serverDir) {
  console.error('[Build] Error: Could not locate server directory with tsconfig.json');
  process.exit(1);
}

console.log(`[Build] Compiling backend server TypeScript in: ${serverDir}`);
const tscBin = path.join(serverDir, 'node_modules', 'typescript', 'bin', 'tsc');

if (fs.existsSync(tscBin)) {
  execSync(`node --max-old-space-size=4096 "${tscBin}"`, { cwd: serverDir, stdio: 'inherit' });
} else {
  execSync('npx tsc', { cwd: serverDir, stdio: 'inherit' });
}

console.log('=== Full Production Build Completed Successfully ===');
