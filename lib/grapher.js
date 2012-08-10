var _       = require('underscore')._,
    Page    = require('./page.js').Page,
    fn      = require('./functions.js'),
    globalOptions = require('./options.js');

_.mixin(require('underscore.Deferred'));

/**
 * The Graphing object uses page objects to scrape URLs for
 * rel=me links. All valid pages are kept in this.pages.
 * Each child page contains a reference to the grapher that
 * created it.
 */
function Grapher (url, options) {
  this.rootUrl     = url;
  this.validUrls   = [url];
  this.pages       = {};
  this.options     = options || {};
  this.options.strict  = this.options.strict !== undefined ? this.options.strict : true;
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
    this.logFetching();
    this.pages[this.rootUrl] = new Page(this.rootUrl, this);
    this.fetchPages(callback);
  },


  /**
   * Fetches each unfetched page in the `this.pages` array.
   * When every page has been fetched, executes callback().
   */
  fetchPages: function (callback) {
    var self = this,
        whenFetched;

    whenFetched = function () {
      self.logFetched();

      if (self.allFetched()) {
        // finished fetching all pages, execute callback.
        self.revalidatePages();
        callback(self);
      } else {
        // some pages haven't been fetched yet, execute self again.
        self.fetchPages(callback);
      }
    }

    _.each(self.pages, function (page) {
      if (page.status === "unfetched") {
        page.fetch(whenFetched);
      }
    });
  },


  /**
   * Returns this.pages as a simplified JSON string.
   */
  toJSON: function () {
    var self   = this,
        rtnObj = {};

    rtnObj = _.map(self.validUrls, function (url) {
      var page = self.pages[url];
      return page.toLiteral();
    });

    self.logRendered(rtnObj);

    return JSON.stringify(rtnObj);
  },

  /**
   * returns the grapher as JSON within a JSONP callback
   * if one is provided, otherwise unencapsulated JSON is
   * returned.
   */
  toJSONP: function (callback) {
    if (callback) {
      return callback + '(' + this.toJSON() + ')';
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
        var same = fn.sameUrl(url, oldUrl);

        if (!same) {
          var oldObj = require('url').parse(oldUrl);

          if (newObj.hostname === oldObj.hostname) {
            return oldObj.path > newObj.path;
          } else {
            return false;
          }
          
          return newObj.domain === oldObj.domain && 
            oldObj.path < newObj.path;
        }

        return same;
      });
    }
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
   * Revalides every page. Neccessary because of the way
   * pages are asyncronously fetched.
   */
  revalidatePages: function () {
    _.each(this.pages, function (page) {
      page.validate();
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