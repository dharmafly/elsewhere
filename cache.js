var _     = require('underscore')._,
    globals = require('./globals.js'),
    cache   = {};


function get (url) {
  return cache[url];
}

function set (url, data) {
  return cache[url] = data;
}

exports.get = get;
exports.set = set;