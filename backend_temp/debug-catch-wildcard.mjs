import express from 'express';

const Router = express.Router;
const OriginalRouter = Router.prototype.route;

// Patch Router.route to catch '*'
Router.prototype.route = function(path) {
  if (path === '*') {
    console.error('CAUGHT: Router.route("*") called at:');
    console.trace();
    throw new Error('Invalid route path: "*" - This is not supported by path-to-regexp v8');
  }
  return OriginalRouter.call(this, path);
};

// Also patch all HTTP method handlers
['get', 'post', 'put', 'patch', 'delete', 'all', 'use'].forEach((method) => {
  const orig = Router.prototype[method];
  Router.prototype[method] = function(path, ...handlers) {
    if (path === '*') {
      console.error(`CAUGHT: Router.${method}("*") called at:`);
      console.trace();
      throw new Error(`Invalid route path: "*" in ${method}() - This is not supported by path-to-regexp v8`);
    }
    return orig.call(this, path, ...handlers);
  };
});

try {
  console.log('Importing server.js...');
  await import('./server.js');
  console.log('Server imported successfully.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
