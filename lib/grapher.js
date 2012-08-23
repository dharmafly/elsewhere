var _       = require('underscore')._,
    Page    = require('./page.js').Page,
    fn      = require('./functions.js'),
    globalOptions = require('./options.js');

_.mixin(require('underscore.Deferred'));

// The Graphing object uses page objects to scrape URLs for
// rel=me links.
// Each child page contains a reference to the grapher that
// created it.
function Grapher (url, options) {
  this.rootUrl      = url;
  this.pages        = {};
  this.crawlCount   = -1;
  this.options      = options || {};

  this.options.strict = this.options.strict !== undefined 
    ? this.options.strict 
    : true;

  this.options.crawlLimit = this.options.crawlLimit !== undefined 
    ? this.options.crawlLimit 
    : globalOptions.crawlLimit;
}

Grapher.prototype = {
  
  constructor: Grapher,

  /**
   * Primary method of the grapher. Fetches the page at the
   * root URL and all subsequent pages. Calls the callback
   * parameter when complete. 
   */
  build: function (callback) {
    var rootPage = new Page(this.rootUrl, this, undefined, 0);

    this.logFetching();
    rootPage.verified = true;
    this.pages[this.rootUrl] = rootPage;
    this.fetchPages(callback);
  },

  // Fetches each unfetched page in the `this.pages` array.
  // When every page has been fetched, executes callback().
  fetchPages: function (callback) {
    var self = this,
        whenFetched;

    whenPageIsFetched = function () {
      self.logFetched();

      if (self.allFetched()) {
        // finished fetching all pages, execute callback.
        callback(self);
      } else {
        // some pages haven't been fetched yet, execute self again.
        self.fetchPages(callback);
      }
    }

    _.each(self.pages, function (page) {
      if (page.status === "unfetched") {
        if (page.level <= self.options.crawlLimit) {
          page.fetch(whenPageIsFetched);
        } else {
          self.pages[page.url].status = "dontfetch";
        }
      }
    });

    if (self.allFetched()) {
      // finished fetching all pages, verify & execute callback.
      self.verifyPages();
      callback(self);
    }
  },

  // A recursive function that checks if all pages are verified
  // and attempts to verify the ones that aren't by checking
  // them for links to ones that are. If at least one link is
  // verified by the function, it returns true. Otherwise it 
  // returns false.
  verifyPages: function (verified) {
    var self          = this,
        verifiedStuff = false;

    _.each(this.pages, function (page) {

      if (!page.verified) {
        page.verified = page.links.some(function (link) {
          var linkedPage = self.getPage(link);

          if (linkedPage !== undefined) {
            if (linkedPage.verified) {
              return true;
            } else {
              return linkedPage.links.some(function (sublink) {
                var subLinkedPage = self.pages[sublink];
                return subLinkedPage !== undefined && subLinkedPage.verified;
              });
            }
          }
        });

        if (page.verified) {
          verifiedStuff = true
          page.level = 0;
        } 
      }

    });

    if (verifiedStuff) {
      return self.verifyPages(true);
    } else {
      return verified === undefined ? false : verified;
    }
  },

  // gets a page from the pages array. Ignores protocol & trailing slashes
  getPage: function (url) {
    var url   = url.substring(url.match(/^https?:\/\//)[0].length,url.length),
        url   = fn.url.removeTrailingSlash(url),
        nowww = fn.url.removeWWW(url),
        http  = "http://" + url,
        https = "https://" + url,
        httpwww    = "http://www." + nowww;
        httpnowww  = "http://" + nowww;
        httpswww   = "https://www." + nowww;
        httpsnowww = "https://" + nowww;

    return this.pages[http]       || this.pages[http + "/"]       ||
           this.pages[https]      || this.pages[https + "/"]      ||
           this.pages[httpwww]    || this.pages[httpwww + "/"]    ||
           this.pages[httpswww]   || this.pages[httpswww + "/"]   ||
           this.pages[httpnowww]  || this.pages[httpnowww + "/"]  ||
           this.pages[httpsnowww] || this.pages[httpsnowww + "/"];
  },

  // returns an object representing the Graph, its pages and stats
  // pertaining to its construction.
  toJSON: function () {
    var self          = this,
        results       = [],
        rtnObj        = {},
        verifiedCount = 0,
        doneTime      = new Date();

    if (self.options.strict) {

      _.each(self.pages, function (page) {
        if (page.verified && page.status === "fetched") { 
          results.push(page.toLiteral(['url', 'title', 'favicon', 'sourceUrl', 'links', 'level']));
        }
      });

    } else {

      _.each(self.pages, function (page) {
        if (page.status === "fetched") {
          results.push(page.toLiteral(['url', 'title', 'favicon', 'sourceUrl', 'links', 'verified', 'level']));
        }
      });

    }

    verifiedCount = _.reduce(_.pluck(self.pages, 'verified')
      , function(m,v){return m + (v ? 1 : 0)});

    rtnObj = {
      results  : results,

      query    : self.rootUrl,
      created  : doneTime.toJSON(),
      crawled  : _.size(self.pages),
      verified : verifiedCount
    };

    self.logRendered(results);

    return JSON.stringify(rtnObj);
  },

  /**
   * returns the grapher as JSON within a JSONP callback
   * if one is provided, otherwise unencapsulated JSON is
   * returned.
   */
  toJSONP: function (callback) {
    if (callback) {
      return callback + '(' + this.toJSON() + ');';
    } else {
      return this.toJSON();
    }
  },

  /**
   * Used to by `Page.addPages` to work out if a page or related
   * page had already been fetched.
   */
  alreadyUsed: function (url) {
    if (this.pages[url]) {
      return true;
    } else {
      var oldUrls = _.pluck(this.pages,'url'),
          newObj  = require('url').parse(url);

      return _.any(oldUrls, function (oldUrl) {
        return fn.sameUrl(url, oldUrl);
      });
    }
  },

  // Checks if the grapher has reached or exceeded its
  // crawl limit. Returns true if it has.
  atCrawlLimit: function () {
    var deepestLevel = 0;

    _.each(this.pages, function (page) {
      if (page.level > deepestLevel) deepestLevel = page.level;
    });

    return deepestLevel > this.options.crawlLimit;
  },

  /**
   * Checks the status of every Page in `this.pages`.
   * Returns true if all are either "fetched" or "error".
   */
  allFetched: function () {
    var statuses = _.pluck(this.pages, 'status');

    return _.all(statuses, function (status) {
      return status === "fetched" || status === "error" || status === "dontfetch";
    });
  },




  // Console logging code...




  /**
   * Logs out to the console the grapher's progress
   * building the graph. Called by `this.fetchPages`
   */
  logFetched: function () {
    if (!globalOptions.logging) return;

    var statuses     = _.pluck(this.pages, 'status'),
        fetchedCount = 0;

    _.each(statuses, function (s) {
      fetchedCount += (s === "fetched" ? 1 : 0);
    });

    process.stdout.write('crawled  ' + 
      fetchedCount + '/' + statuses.length + 
      " : " + this.rootUrl + fn.whitespace(20) + "\r");
  },

  /**
   * Logs out to the console how many pages are
   * rendered by `this.toJSON`
   */
  logRendered: function (obj) {
    if (!globalOptions.logging) return;

    process.stdout.write('\nrendered ' + 
      _.size(obj) + '/' + _.size(this.pages) + 
      " : " + this.rootUrl + "\n");
  },

  /**
   * Logs out to the console when the grapher begins
   * building the graph.
   */
  logFetching: function () {
    if (!globalOptions.logging) return;

    process.stdout.write('graphing ' + this.rootUrl + fn.whitespace(20) + "\n");
  }
}


/**
 * Handles creating the object and running build.
 * Executes callback() parameter when graph has
 * been built, also returns a promise that resolves
 * at that same moment.
 */
function graph (url, options, callback) {
  var grapher  = new Grapher(url, options),
      deferred = _.Deferred(),
      promise  = deferred.promise();

  grapher.build(function (graph) {
    if (callback) callback(graph);
    deferred.resolve(graph);
  });

  return promise;
}

/**
 * Takes a query object like the kind generated by
 * require('url').parse(req.url, true).query.
 * It then calls graph() with that info.
 */
function graphFromQuery(query, callback) {
  var url     = query.q,
      options = {strict:(query.strict !== undefined)},
      urlBits = require('url').parse(url, true);

  if (urlBits.protocol) {
    url = urlBits.href;
  } else {
    url = "http://" + urlBits.href;
  }

  return graph(url, options, callback);
}

exports.Grapher = Grapher;
exports.graph = graph;
exports.graphFromQuery = graphFromQuery;
exports.options = globalOptions;