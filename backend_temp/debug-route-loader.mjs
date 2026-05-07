import express from 'express';
const methods = ['use', 'get', 'post', 'put', 'delete', 'patch', 'options', 'all', 'head'];
for (const method of methods) {
  if (typeof express.application[method] === 'function') {
    const orig = express.application[method];
    express.application[method] = function (path, ...args) {
      console.log(`App.${method}`, path);
      return orig.call(this, path, ...args);
    };
  }
  const routerProto = express.Router.prototype[method];
  if (typeof routerProto === 'function') {
    const orig = routerProto;
    express.Router.prototype[method] = function (path, ...args) {
      console.log(`Router.${method}`, path);
      return orig.call(this, path, ...args);
    };
  }
}
const origRoute = express.Router.prototype.route;
express.Router.prototype.route = function (path) {
  console.log('Router.route', path);
  return origRoute.call(this, path);
};

try {
  await import('./server.js');
} catch (err) {
  console.error('IMPORT ERROR', err);
  console.error(err.stack);
  process.exit(1);
}
