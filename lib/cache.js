var _     = require('underscore')._,
    globals = require('./globals.js'),
    cache   = {};


function get (url) {
  return cache[url];
}

function has(url) {
  return cache[url] !== undefined;
}

function fetch (url, callback) {
  callback(null, cache[url]);
}

function set (url, data) {
  return cache[url] = data;
}

exports.get = get;
exports.has = has;
exports.set = set;
exports.fetch = fetch;