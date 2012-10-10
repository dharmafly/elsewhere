var _       = require('underscore')._,
    options = require('./options.js'),
    cache   = {};


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

function checkLimits () {
  var time = new Date().getTime(),
      i;
  // remove out of date items
  for (i in cache) {
    if ((time - cache[i].time) > options.cacheTimeLimit) {
      delete cache[i];
    }
  }

  // remove some items if over size limit
  // this needs to be reworked to remove on first in first out
  if(_.size(cache) > options.cacheItemLimit){
    var x = 0;
    for (i in cache) {
      if (x > itemLimit) {
        delete cache[i];
      }
      x ++;
    }
  }

  setTimeout(checkLimits, 10000);
}

checkLimits ();

exports.get = get;
exports.has = has;
exports.set = set;
exports.fetch = fetch;