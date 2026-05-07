import express from 'express';

// Monkey patch Express Router methods to catch path-to-regexp errors
const methods = ['get', 'post', 'put', 'delete', 'patch', 'use', 'all', 'head'];

methods.forEach(method => {
  if (express.Router.prototype[method]) {
    const original = express.Router.prototype[method];
    express.Router.prototype[method] = function(path, ...args) {
      try {
        return original.call(this, path, ...args);
      } catch (err) {
        if (err.message.includes('Missing parameter name') || err.message.includes('pathToRegexpError')) {
          console.error(`ERROR in Router.${method} with path:`, JSON.stringify(path));
          console.error('Error details:', err.message);
          console.error('Stack:', err.stack);
        }
        throw err;
      }
    };
  }

  if (express.application[method]) {
    const original = express.application[method];
    express.application[method] = function(path, ...args) {
      try {
        return original.call(this, path, ...args);
      } catch (err) {
        if (err.message.includes('Missing parameter name') || err.message.includes('pathToRegexpError')) {
          console.error(`ERROR in App.${method} with path:`, JSON.stringify(path));
          console.error('Error details:', err.message);
          console.error('Stack:', err.stack);
        }
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