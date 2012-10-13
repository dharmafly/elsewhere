var urlParser       = require('url'),
    _               = require('underscore')._,
    Page            = require('./page.js').Page,
    fn              = require('./functions.js'),
    internalCache   = require('./cache.js'),
    internalLogger  = require('./logger.js'),
    globalOptions   = require('./options.js');

_.mixin(require('underscore.Deferred'));


// The Graphing object uses page objects to scrape URLs for
// rel=me links.
// Each child page contains a reference to the grapher that
// created it.
function Grapher (url, options) {
  this.rootUrl      = url;
  this.pages        = {};
  this.crawlCount   = -1;
  this.domainCounts = [];
  
  this.options      = options || {};
  this.cache = (options.cache)? options.cache : internalCache;
  this.logger = (options.logger)? options.logger : internalLogger;

  if(!fn.isBoolean(options.strict))
    options.strict = globalOptions.strict

  this.options.crawlLimit = this.options.crawlLimit !== undefined
    ? parseInt(this.options.crawlLimit, 10) : globalOptions.crawlLimit;

  this.options.domainLimit = this.options.domainLimit !== undefined
    ? parseInt(this.options.domainLimit, 10) : globalOptions.domainLimit;

  if(!fn.isBoolean(options.stripDeeperLinks))
    options.stripDeeperLinks = globalOptions.stripDeeperLinks

}


Grapher.prototype = {

  constructor: Grapher,

  /**
   * Primary method of the grapher. Fetches the page at the
   * root URL and all subsequent pages. Calls the callback
   * parameter when complete.
   */
  build: function (callback) {  
    var rootPage = new Page(this.rootUrl, this, this.logger, undefined, 0);
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
      if (self.allFetched()) {
        // finished fetching all pages, execute callback.
        self.verifyPages();
        self.logFetched();
        callback(self);
      } else {
        // some pages haven't been fetched yet, execute self again.
        findUnfetchedPages();
      }
    };

    findUnfetchedPages = function(){ 
       _.each(self.pages, function (page) {
        if (page.status === "unfetched") {
          if (page.level <= self.options.crawlLimit) {
            page.fetch(self.cache, whenPageIsFetched);
          } else {
            self.logger.log('over the crawl limit: ' + page.url + ' - page level: ' + page.level);
            self.pages[page.url].status = "dontfetch";
            whenPageIsFetched();
          }
        }
      });
    };

    findUnfetchedPages();
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
  toLiteral: function () {
    var self          = this,
        results       = [],
        rtnObj        = {},
        verifiedCount = 0,
        doneTime      = new Date(),
        truthTest, propList, pages;

    if (self.options.strict) {
      propList  = ['url', 'title', 'favicon', 'links', 'inboundCount'];
      truthTest = function (page) {
        return page.verified && page.status === "fetched";
      }
    } else {
      propList  = ['url', 'title', 'favicon', 'links', 'verified', 'inboundCount'];
      truthTest = function (page) {
        return page.status === "fetched";
      }
    }

    pages = _.filter(self.pages, truthTest);
    if (self.options.stripDeeperLinks) pages = self.stripDuplicates(pages);
    results = _.map(pages, function (page) {return page.toLiteral(propList)});

    verifiedCount = _.reduce(_.pluck(self.pages, 'verified')
      , function(m,v){return m + (v ? 1 : 0)});

    rtnObj = {
      results  : results,

      query    : self.rootUrl,
      created  : doneTime.toJSON(),
      crawled  : _.size(self.pages),
      verified : verifiedCount
    };


    return rtnObj;
  },

  toJSON: function () {
    return JSON.stringify(this.toLiteral());
  },


  // used to remove duplicate pages and 
  // also removes by items by pageDepth 
  stripDuplicates: function (pages) {
    var rtnObj = {};

    _.each(pages, function (currPage) {
      var currPageDomain  = urlParser.parse(currPage.url).hostname,
          sameDomainPages = [],
          hasShorterPaths = false,
          currPagePath, currPageDepth;

      sameDomainPages = _.filter(pages, function (page) {
        return currPageDomain === urlParser.parse(page.url).hostname && page.url !== currPage.url;
      });

      if (_.isEmpty(sameDomainPages)) {
        rtnObj[currPage.url] = currPage;
      } else {
        currPagePath = fn.url.removeTrailingSlash(urlParser.parse(currPage.url).path);
        currPageDepth = currPagePath.split('/').length;

        hasShorterPaths = _.any(sameDomainPages, function (page) {
          var pagePath  = fn.url.removeTrailingSlash(urlParser.parse(page.url).path),
              pageDepth = pagePath.split('/').length;

          return pageDepth < currPageDepth;
        });

        if (!hasShorterPaths) {
          rtnObj[currPage.url] = currPage;
        }
      }
    });

    return rtnObj;
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


  /**
   * Used to by `Page.addPages` to work out if a page request
   * is from a domain which has already hit its limit
   */
  aboveDomainLimit: function (url) {
    var hostname = urlParser.parse(url).hostname;
    hostname = fn.url.removeWWW(hostname); 

    var i = this.domainCounts.length;
    while (i--) {
      if(this.domainCounts[i].hostname === hostname){
        if(this.domainCounts[i].count > this.options.domainLimit){
          return true;
        }else{
          return false;
        }
      }
    }
    return false;
  },


  /**
    * Appends a count against a domain in domainCounts
    */
  appendDomainCount: function (url) {
    var i = this.domainCounts.length,
        hostname = urlParser.parse(url).hostname,
        found = false;
        
    if(hostname){
      hostname = fn.url.removeWWW(hostname);    
      while (i--) {
        if(this.domainCounts[i].hostname === hostname){
          this.domainCounts[i].count ++;
          found = true;
        }
      }
      if(!found){
        this.domainCounts.push({
          'hostname': hostname, 
          'count': 1
        })
      }
    }
  },


  verifiedLink: function (url) {
    return this.pages[url]
      ? this.pages[url].verified
      : _.any(this.pages, function (page) {
        return fn.sameUrl(page.url, url) && page.verified;
      });
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
      return status === "fetched" || status === "error" || status === "dontfetch" || status === "errored";
    });
  },

  logFetched: function () {
    var statuses     = _.pluck(this.pages, 'status'),
        fetchedCount = 0;
        errorCount = 0;
        dontFetchedCount = 0;

    _.each(statuses, function (s) {
      fetchedCount += (s === "fetched" ? 1 : 0);
      errorCount += (s === "error" ? 1 : 0);
      dontFetchedCount += (s === "dontfetch" ? 1 : 0);
    });

    this.logger.info('total pages ' + statuses.length);
    this.logger.info('total fetched ' + fetchedCount);
    this.logger.info('total errors ' + errorCount);
    this.logger.info('total pages outside limits ' + dontFetchedCount);
  },

}


/**
 * Handles creating the object and running build.
 * Executes callback() parameter when graph has
 * been built, also returns a promise that resolves
 * at that same moment.
 */
function graph (url, options, callback) {
  var deferred = _.Deferred(),
      promise  = deferred.promise(),
      grapher;

  if (arguments.length == 2 && _.isFunction(options)) {
    callback = options;
    options = {};
  }
  if(!options.cache){
    options.cache = internalCache;
  }

  if(!options.logger){
    options.logger = internalLogger;
  }


  options.logger.info('-----------------------------------------------')
  options.logger.info('Elsewhere started - with url: ' + url);

  
  grapher = new Grapher(url, options);
  var startedParse = new Date();


  grapher.build(function (graph) {
    // log the total html request time
    var requestTimes = _.pluck(graph.pages, 'requestTime'),
        total = 0;

    _.each(requestTimes, function (x) {
      total += x;
    });
    options.logger.info('total html request time: ' + total + 'ms');

    // log the total time taken
    var endedParse = new Date();
    var ms = endedParse.getTime() - startedParse.getTime();
    options.logger.info('total time taken: ' + ms + 'ms');

    if (callback) {
      callback(graph);
    }

    deferred.resolve(graph);
  });


  return promise;
}

exports.Grapher = Grapher;
exports.graph = graph;
exports.cache = Grapher.cache;
exports.options = globalOptions;