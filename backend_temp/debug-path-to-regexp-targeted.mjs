import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pathToRegexp = require('path-to-regexp');
const pathToRegexpDistPath = fileURLToPath(new URL('./node_modules/path-to-regexp/dist/index.js', import.meta.url));
const pathToRegexpDist = require(pathToRegexpDistPath);
const originalPathToRegexp = pathToRegexp.pathToRegexp || pathToRegexpDist.pathToRegexp;
const originalParse = pathToRegexp.parse || pathToRegexpDist.parse;

function inspectP2R(pathArg, location) {
  console.log(`path-to-regexp ${location} called with path:`, pathArg);
  if (typeof pathArg === 'string' && pathArg.includes('https://git.new/pathToRegexpError')) {
    console.error('FOUND THE CORRUPTED PATH in path-to-regexp:', pathArg);
    console.trace('Stack trace for corrupted path registration');
    throw new Error(`Corrupted path detected: ${pathArg}`);
  }
}

function wrapP2R(module, name) {
  if (typeof module[name] !== 'function') return;
  const original = module[name];
  module[name] = function(pathArg, ...args) {
    inspectP2R(pathArg, `${module === pathToRegexpDist ? 'dist' : 'pkg'}.${name}`);
    return original.call(this, pathArg, ...args);
  };
}

wrapP2R(pathToRegexp, 'pathToRegexp');
wrapP2R(pathToRegexp, 'parse');
wrapP2R(pathToRegexp, 'match');
wrapP2R(pathToRegexpDist, 'pathToRegexp');
wrapP2R(pathToRegexpDist, 'parse');
wrapP2R(pathToRegexpDist, 'match');

const routerProto = express.Router.prototype;
const appProto = express.application;

function wrapProtoMethod(proto, methodName) {
  if (typeof proto[methodName] !== 'function') return;
  const original = proto[methodName];
  proto[methodName] = function(pathArg, ...handlers) {
    console.log(`${methodName} called with path:`, pathArg);
    if (typeof pathArg === 'string' && pathArg.includes('https://git.new/pathToRegexpError')) {
      console.error('FOUND THE CORRUPTED PATH in Express route call:', pathArg);
      console.trace('Stack trace for corrupted route registration');
      throw new Error(`Corrupted route path detected: ${pathArg}`);
    }
    return original.call(this, pathArg, ...handlers);
  };
}

['use', 'get', 'post', 'put', 'delete', 'patch', 'all', 'route'].forEach((method) => {
  wrapProtoMethod(routerProto, method);
  wrapProtoMethod(appProto, method);
});

try {
  console.log('Importing server.js...');
  await import('./server.js');
  console.log('Server imported successfully.');
} catch (error) {
  console.error('Import failed:', error.message);
  console.error(error.stack);
}
