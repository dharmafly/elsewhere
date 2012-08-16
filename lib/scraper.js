var _             = require('underscore')._,
    jsdom         = require('jsdom'),
    jquery        = require('fs').readFileSync(__dirname + '/../vendor/jquery.js').toString(),
    cache         = require('./cache.js'),
    globalOptions = require('./options.js'),
    instanceLimit = globalOptions.jsdomInstanceLimit,
    instances     = 0;

/**
 * Uses jsdom to scrape a page for 'rel=me' links, the title
 * of the page, and its favicon.
 */
function scrape (url, callback, options) {
  if (atInstanceLimit()) {
    setTimeout(function () {
      scrape(url, callback, options);
    },500);
    return;
  }

  options = options || {};

  var cacheResponse = options.cache || true;

  var data = {
    links: []
  };

  instances++;

  jsdom.env({
    html: url,
    src: [jquery],
    done: function(errors, window) {
      if (!errors) {

        // get links
        window.$("a[rel~=me]").each(function (i, elem) {
          if (elem.href.substring(0,1) !== '/') {
            data.links.push(elem.href);
          }
        });

        // get the title, regex gets rid of new line characters etc.
        data.title = window.document.title.replace(/(\r\n|\n|\r)/gm,"").trim();

        // get the favicon
        data.favicon = resolveFavicon(window, url);

        //var siteName = window.$('meta[property="og:site_name"]').get(0);
        //data.siteName = siteName ? siteName.content : null;

        if (cacheResponse) cache.set(url, data);
      }

      // release memory used by window object
      if (window) window.close();

      // call the passed callback
      callback(errors, data);

      // decrement the number of running jsdom instances
      instances--;
    }
  });
}

function atInstanceLimit () {
  return instances >= instanceLimit;
}

/**
 * Scrapes the favicon from the page if there is one,
 * if not then defaults to /favicon.ico. Should always
 * return a full URL.
 */
function resolveFavicon (window, url) {
  var favicon   = window.$('link[rel="shortcut icon"]'),
      url       = require('url').parse(url),
      rootUrl   = url.protocol + "//" + url.host,
      rtn;

  if (favicon.length > 0) {
    favicon = favicon[0].href;

    if (favicon.substring(0,2) === "//") {
      rtn = url.protocol + favicon;
    } else if (favicon.substring(0,1) === "/") {
      rtn = rootUrl + favicon;
    } else {
      rtn = favicon;
    }

  } else {
    rtn = rootUrl + "/favicon.ico";
  }

  return rtn;
}

exports.scrape = scrape;