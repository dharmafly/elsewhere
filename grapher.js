var _       = require('underscore')._,
    globals = require('./globals.js'),
    Page    = require('./page.js').Page;

_.mixin(require('underscore.deferred'));

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

/**
 * The Graphing object uses page objects to scrape URLs for
 * rel=me links. All valid pages are kept in this.pages.
 * Each child page contains a reference to the grapher that
 * created it.
 */
function Grapher (url, options) {
  this.rootUrl   = url;
  this.validUrls = [url];
  this.pages     = {};
  this.options   = options || {};
  this.options.strict = this.options.strict !== undefined ? this.options.strict : true;
}

Grapher.prototype = {
  
  constructor: Grapher,
  validUrls: [],

  /**
   * Primary method of the grapher. Fetches the page at the
   * root URL and all subsequent pages. Calls the callback
   * parameter when complete. 
   */
  build: function (callback) {
    this.pages[this.rootUrl] = new Page(this.rootUrl, this);
    process.stdout.write('\nfetching ' + this.rootUrl + "\n");
    this.fetchPages(callback);
  },

  /**
   * Returns this.pages as a simplified JSON string.
   */
  toJSON: function () {
    var self   = this,
        rtnObj = {};

    rtnObj = _.map(self.validUrls, function (url) {
      var page = self.pages[url];
      return {
        url:     url,
        title:   page.title,
        favicon: page.favicon
      }
    });

    process.stdout.write('\nrendered ' + _.size(rtnObj) + ' links for ' + self.rootUrl + "\n");

    return JSON.stringify(rtnObj);
  },

  /**
   * Used to by `addPages` to work out if a page or related
   * page had already been fetched.
   */
  alreadyUsed: function (url) {
    var oldUrls = _.pluck(this.pages, 'url'),
        newObj = require('url').parse(url);

    if (this.pages[url]) {
      return true;
    } else {
      return _.any(oldUrls, function (oldUrl) {
        var same = sameUrl(url, oldUrl);

        if (!same) {
          var oldObj = require('url').parse(oldUrl);

          if (newObj.hostname === oldObj.hostname) {
            return oldObj.path > newObj.path;
          } else {
            return false;
          }
          
          return nUrlObj.domain === oUrlObj.domain && 
            oUrlObj.path < nUrlObj.path;
        }

        return same;
      });
    }
  },

  /**
   * Used by `Page.fetch` to add new Page objects to the Grapher
   * for each link which has not yet been fetched.
   */
  addPages: function (newLinks, sourceUrl) {
    var self = this;

    _.each(newLinks, function (newLink) {
      if (!self.alreadyUsed(newLink)) {
        self.pages[newLink] = new Page(newLink, self, sourceUrl);
      }
    });
  },

  /**
   * Checks the status of every Page in `this.pages`.
   * Returns true if all are either "fetched" or "error".
   */
  allFetched: function () {
    var statuses = _.pluck(this.pages, 'status');

    return _.all(statuses, function (status) {
      return status === "fetched" || status === "error";
    });
  },

  /**
   * Fetches each unfetched page in the `this.pages` array.
   * When every page has been fetched, executes callback().
   */
  fetchPages: function (callback) {
    var self = this,
        whenFetched;

    whenFetched = function () {
      var statuses     = _.pluck(self.pages, 'status'),
          fetchedCount = 0;

      _.each(statuses, function (s) {
        fetchedCount += (s === "fetched" ? 1 : 0);
      });

      process.stdout.write('fetched ' + 
        fetchedCount + '/' + statuses.length + " \r");

      if (self.allFetched()) {
        process.stdout.write('\nfetched all for ' + self.rootUrl + "\n");
        callback();
      } else {
        self.fetchPages(callback);
      }
    }

    _.each(self.pages, function (page) {
      if (page.status === "unfetched") {
        page.fetch(whenFetched);
      }
    });
  }
}

exports.Grapher = Grapher;