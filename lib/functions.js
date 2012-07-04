var _       = require('underscore')._;

/**
 * Returns whitespace as long as the provided
 * number of times
 */
function whitespace (numberOfCharacters) {
  return new Array(numberOfCharacters).join(" ");
}

/**
 * Function for determining if two URLs are identical.
 * Ignores 'www' and trailing slashes.
 * Treats 'http' and 'https' the same.
 */
function sameUrl (url1, url2) {

  function removeWWW (a) {
    return a.search('www') !== -1 ? a.substring(0,7) + 
      a.substring(11,a.length) : a;
  }

  function removeTrailingSlash (a) {
    return a[a.length-1] === "/" ? a.substring(0,a.length-1) : a;
  }

  function removeProtocol (a) {
    return a[4] === ":" ? a.substring(5) : 
           a[5] === ":" ? a.substring(6) : a;
  }

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

exports.sameUrl = sameUrl;
exports.whitespace = whitespace;