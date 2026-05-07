import express from 'express';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Monkey patch Express to log routes
const originalRouterMethods = {};
const methods = ['get', 'post', 'put', 'delete', 'patch', 'use', 'all', 'head'];

methods.forEach(method => {
  if (express.Router.prototype[method]) {
    originalRouterMethods[method] = express.Router.prototype[method];
    express.Router.prototype[method] = function(path, ...args) {
      console.log(`Router.${method}: ${path}`);
      try {
        return originalRouterMethods[method].call(this, path, ...args);
      } catch (err) {
        console.error(`ERROR in Router.${method}(${path}):`, err.message);
        throw err;
      }
    };
  }

  if (express.application[method]) {
    const origApp = express.application[method];
    express.application[method] = function(path, ...args) {
      console.log(`App.${method}: ${path}`);
      try {
        return origApp.call(this, path, ...args);
      } catch (err) {
        console.error(`ERROR in App.${method}(${path}):`, err.message);
        throw err;
      }
    };
  }
});

// Now try to import the server
try {
  await import('./server.js');
  console.log('Server imported successfully');
} catch (err) {
  console.error('Failed to import server:', err.message);
  console.error('Stack:', err.stack);
}