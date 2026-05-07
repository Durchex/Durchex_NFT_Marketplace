import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey patch path-to-regexp to catch the error
const pathToRegexp = await import('path-to-regexp');

const originalPathToRegexp = pathToRegexp.pathToRegexp;
pathToRegexp.pathToRegexp = function(path, keys, options) {
  console.log('path-to-regexp called with path:', path);
  if (typeof path === 'string' && path.includes('https://git.new/pathToRegexpError')) {
    console.error('FOUND THE CORRUPTED PATH:', path);
    console.trace('Stack trace:');
    throw new Error(`Corrupted path detected: ${path}`);
  }
  return originalPathToRegexp.call(this, path, keys, options);
};

// Now try to import the server
try {
  console.log('Attempting to import server.js...');
  await import('./server.js');
  console.log('Server imported successfully');
} catch (error) {
  console.error('Error importing server:', error.message);
  console.error('Stack trace:', error.stack);
}