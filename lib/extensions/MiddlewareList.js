'use strict';

const assert = require('assert');

module.exports = MiddlewareList;

function MiddlewareList() {
  this._middleware = [];
}

/**
 * Adds a middleware for request handling.
 *
 * Same as connect.use().
 *
 * @param {String} [path] - path prefix
 * @param {Function} handler - request handler middleware
 * @return this for chaining
 */
MiddlewareList.prototype.use = function (path, handler) {
  if (handler !== undefined) {
    assert(typeof path === 'string', 'path should be a string');
    assert(typeof handler === 'function', 'handler should be a function');
    this._middleware.push({ path: path, handler: handler });
  } else {
    handler = path;
    assert(typeof handler === 'function', 'handler should be a function');
    this._middleware.push(handler);
  }
  return this;
};