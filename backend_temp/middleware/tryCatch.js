// ESM-compatible async error handler middleware
export default function tryCatch(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
