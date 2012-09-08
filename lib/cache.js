var _     = require('underscore')._,
    limit = require('./options.js').cacheLimit,
    cache = {};


function get (url) {
  return cache[url].data;
}

function has(url) {
  return cache[url] !== undefined;
}

function fetch (url, callback) {
  callback(null, cache[url].data);
}

function set (url, data) {
  return cache[url] = {
    time:new Date().getTime(),
    data:data
  };
}

function cleanUp () {
  var time = new Date().getTime(),
      i;

  //console.log('cache size:', _.size(cache));

  for (i in cache) {
    if ((time - cache[i].time) > limit) {
      delete cache[i];
    }
  }

  setTimeout(cleanUp, 10000);
}

cleanUp();

exports.get = get;
exports.has = has;
exports.set = set;
exports.fetch = fetch;