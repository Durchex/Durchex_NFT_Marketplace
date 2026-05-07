import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesDir = path.resolve(__dirname, 'routes');
const require = createRequire(import.meta.url);

const pathToRegexp = require('path-to-regexp');
const pathToRegexpDist = require(pathToFileURL(path.resolve(__dirname, 'node_modules', 'path-to-regexp', 'dist', 'index.js')).href);

function wrap(module, name) {
  if (typeof module[name] !== 'function') return;
  const orig = module[name];
  module[name] = function(pathArg, ...args) {
    console.log(`[PATCH] ${name} called with path:`, pathArg);
    return orig.call(this, pathArg, ...args);
  };
}

['match', 'parse', 'pathToRegexp', 'compile'].forEach((name) => {
  wrap(pathToRegexp, name);
  wrap(pathToRegexpDist, name);
});

const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'));

for (const file of routeFiles) {
  const routePath = path.join(routesDir, file);
  const routeUrl = pathToFileURL(routePath).href;
  process.stdout.write(`Importing ${file}... `);
  try {
    await import(routeUrl);
    console.log('OK');
  } catch (err) {
    console.log('FAILED');
    console.error(err.stack);
    process.exit(1);
  }
}
console.log('All route modules imported successfully.');
