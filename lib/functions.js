var _       = require('underscore')._,
    options = require('./options.js');


// returns whitespace as long as the provided number of times
function whitespace (numberOfCharacters) {
  return new Array(numberOfCharacters).join(" ");
}

// trims both sides of a string
function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

// returns if a object a string
function isString(obj) {
    return typeof (obj) === 'string';
}

// returns if a object a boolean
function isBoolean(obj) { 
  return typeof(obj) === "boolean"; 
};

// removes www. from a string
function removeWWW (a) {
  var wwwpos = a.search('www.');
  return wwwpos !== -1 ? a.substring(0, wwwpos) + 
    a.substring(wwwpos + 4,a.length) : a;
}

function removeTrailingSlash (a) {
  return a[a.length-1] === "/" ? a.substring(0,a.length-1) : a;
}

function removeProtocol (a) {
  var protocolpos = a.match(/^https?:\/\//),
      protocolpos = protocolpos !== null ? protocolpos[0].length : 0;

  return a.substring(protocolpos, a.length);
}



/**
 * Function for determining if two URLs are identical.
 * Ignores 'www' and trailing slashes.
 * Treats 'http' and 'https' the same.
 */
function sameUrl (url1, url2) {
  // remove www if www is present
  url1 = removeWWW(url1);
  url2 = removeWWW(url2);

  // remove trailing slash if one is present
  url1 = removeTrailingSlash(url1);
  url2 = removeTrailingSlash(url2);

  // remove protocol of http or https
  url1 = removeProtocol(url1);
  url2 = removeProtocol(url2);

  return url1 === url2;
}


exports.trim = trim;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.sameUrl = sameUrl;
exports.whitespace = whitespace;
exports.url = {
  removeWWW: removeWWW,
  removeTrailingSlash: removeTrailingSlash,
  removeProtocol: removeProtocol
};