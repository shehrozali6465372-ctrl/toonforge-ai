'use strict';

/**
 * Work around @rollup/plugin-terser 1.0.0 assuming os.cpus().length is non-zero.
 * In some constrained Linux containers os.cpus() returns [], leaving the Workbox
 * service-worker minification worker pool with maxInstances=0 and a never-settling
 * build. Keep this patch version-locked and idempotent; remove it when the upstream
 * dependency handles an empty CPU list and the clean build-exit check passes.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJsonPath = path.join(root, 'node_modules', '@rollup', 'plugin-terser', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  throw new Error('@rollup/plugin-terser is missing; Workbox build dependency was not installed');
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.version !== '1.0.0') {
  throw new Error(`Unexpected @rollup/plugin-terser version ${packageJson.version}; review/remove the 1.0.0 compatibility patch`);
}

const targets = [
  {
    file: 'src/worker-pool.ts',
    before: 'this.maxInstances = options.maxWorkers || cpus().length;',
    after: 'this.maxInstances = Math.max(1, options.maxWorkers || cpus().length);',
  },
  {
    file: 'dist/es/index.js',
    before: 'this.maxInstances = options.maxWorkers || cpus().length;',
    after: 'this.maxInstances = Math.max(1, options.maxWorkers || cpus().length);',
  },
  {
    file: 'dist/cjs/index.js',
    before: 'this.maxInstances = options.maxWorkers || os.cpus().length;',
    after: 'this.maxInstances = Math.max(1, options.maxWorkers || os.cpus().length);',
  },
];

for (const target of targets) {
  const filePath = path.join(root, 'node_modules', '@rollup', 'plugin-terser', target.file);
  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes(target.after)) {
    continue;
  }
  const occurrences = source.split(target.before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Expected one patch target in ${target.file}, found ${occurrences}`);
  }
  fs.writeFileSync(filePath, source.replace(target.before, target.after));
}

console.log('Applied @rollup/plugin-terser 1.0.0 zero-CPU worker fallback.');
