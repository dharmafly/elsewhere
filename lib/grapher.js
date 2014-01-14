var urlParser       = require('url'),
    _               = require('underscore')._,
    wf              = require('webfinger'),
    Page            = require('./page.js').Page,
    fn              = require('./functions.js'),
    internalCache   = require('./cache.js'),
    internalLogger  = require('./logger.js'),
    internalOptions = require('./options.js');

_.mixin(require('underscore.deferred'));


// The Graphing object uses page objects to scrape URLs for
// rel=me links.
// Each child page contains a reference to the grapher that
// created it.
function Grapher (url, options) {
  this.rootUrl      = url;
  this.pages        = {};
  this.crawlCount   = -1;
  this.domainCounts = [];
  
  this.options = options || {};
  mergeOptions(this.options);
}


Grapher.prototype = {

  constructor: Grapher,

  // Primary method of the grapher. Fetches the page at the
  // root URL and all subsequent pages. Calls the callback
  // parameter when complete.
  build: function (callback) { 
    var logger        = this.options.logger,
        startedParse  = new Date();

    // log the start of the graph build 
    logger.info('elsewhere started - with url: ' + this.rootUrl);

    var rootPage = new Page(this.rootUrl, this, this.options, undefined, 0);
    rootPage.verified = true;
    this.pages[this.rootUrl] = rootPage;

    this.fetchPages(function (err, graph) {
      // log the end of the graph build 
      var requestTimes = _.pluck(graph.pages, 'requestTime'),
          total = 0;

      _.each(requestTimes, function (x) {
        total += x;
      });
      logger.info('total html request time: ' + total + 'ms');

      var ms = new Date().getTime() - startedParse.getTime();
      logger.info('total time taken: ' + ms + 'ms');

      callback(err, graph);
    });
  },


  // Fetches each unfetched page in the `this.pages` array.
  // When every page has been fetched, executes callback().
  fetchPages: function (callback) {
    var self = this,
        whenFetched;

    whenPageIsFetched = function (page) {
      // if the root url errors, stop the whole parse with by throwing an error 
      if (page && page.status === "errored" && page.url === self.rootUrl) {
        callback(page.errorMsg, self);
      } else {
        if (self.allFetched()) {
          // finished fetching all pages, execute callback.
          self.verifyPages();
          self.logFetched();
          callback(null, self);
        } else {
          // some pages haven't been fetched yet, execute self again.
          findUnfetchedPages();
        }
      }
    };

    findUnfetchedPages = function(){ 
      _.each(self.pages, function (page) {
        if (page.status === "unfetched") {
          if (page.level <= self.options.crawlLimit) {
            page.fetch(whenPageIsFetched);
          } else {
            self.options.logger.log('over the crawl limit: ' + page.url + ' - page level: ' + page.level);
            self.pages[page.url].status = "dontfetch";
            whenPageIsFetched();
          }
        }
      });
    };

    findUnfetchedPages();
  },


  replaceAliases: function () {
    var didSomeReplacing = false;

    _.each(this.pages, function (page, key, pages) {
      page.aliases.forEach(function (alias) {
        _.each(pages, function (pg, k, pgs) {
          pg.links.forEach(function (link, i) {
            if (link === alias) {
              pg.links[i] = page.url;
              didSomeReplacing = true;
            }
          });
        });
      });
    });

    if (didSomeReplacing) {
      var newPages = {};
      _.each(this.pages, function (page) {
        newPages[page.url] = page;
      });
      this.pages = newPages;
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
    if (url.indexOf('http') === 0) {
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

    } else {
      return undefined;
    }
  },

  // returns an object representing the Graph, its pages and stats
  // pertaining to its construction.
  toLiteral: function (err) {
    var self          = this,
        results       = [],
        warnings      = [],
        rtnObj        = {},
        verifiedCount = 0,
        doneTime      = new Date(),
        truthTest, propList, pages;

    if (self.options.strict) {
      propList  = ['url', 'title', 'favicon', 'links', 'inboundCount', 'aliases'];
      truthTest = function (page) {
        return page.verified && page.status === "fetched";
      }
    } else {
      propList  = ['url', 'title', 'favicon', 'links', 'verified', 'inboundCount', 'aliases'];
      truthTest = function (page) {
        return page.status === "fetched";
      }
    }

    pages = _.filter(self.pages, truthTest);
    if (self.options.stripDeeperLinks){ 
      pages = self.stripDuplicates(pages)
    };
    
    results = _.map(pages, function (page) {
      return page.toLiteral(propList)
    });

    for (var key in self.pages) {
      var page = self.pages[key];
      if(page.getWarning() !== null){
        warnings.push(page.getWarning());
      }
    }

    verifiedCount = _.reduce(_.pluck(self.pages, 'verified')
      , function(m,v){return m + (v ? 1 : 0)});

    if (err) {
      rtnObj = {
        query    : self.rootUrl,
        created  : doneTime.toJSON(),
        crawled  : _.size(self.pages),
        verified : 0
      };
    } else {
      rtnObj = {
        results  : results,
        query    : self.rootUrl,
        created  : doneTime.toJSON(),
        crawled  : _.size(self.pages),
        verified : verifiedCount
      };
    }

    if (!err && warnings.length > 0) {
      rtnObj.warnings = warnings;
    }

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


  // returns the grapher as JSON within a JSONP callback
  // if one is provided, otherwise unencapsulated JSON is
  // returned.
  toJSONP: function (callback) {
    if (callback) {
      return callback + '(' + this.toJSON() + ');';
    } else {
      return this.toJSON();
    }
  },


  // Used to by `Page.addPages` to work out if a page or related
  // page had already been fetched.
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


  // Used to by `Page.addPages` to work out if a page request
  // is from a domain which has already hit its limit
  aboveDomainLimit: function (url) {
    var hostname = urlParser.parse(url).hostname;
        hostname = fn.url.removeWWW(hostname); 

    var i = this.domainCounts.length;
    while (i--) {
      if (this.domainCounts[i].hostname === hostname) {
        if (this.domainCounts[i].count > this.options.domainLimit) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  },


  // Appends a count against a domain in domainCounts
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

  // Checks the status of every Page in `this.pages`.
  // Returns true if all are either "fetched" or "error".
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
        dontFetchedCount = 0,
        logger = this.options.logger;

    _.each(statuses, function (s) {
      fetchedCount += (s === "fetched" ? 1 : 0);
      errorCount += (s === "error" ? 1 : 0);
      dontFetchedCount += (s === "dontfetch" ? 1 : 0);
    });

    logger.info('total pages ' + statuses.length);
    logger.info('total fetched ' + fetchedCount);
    logger.info('total errors ' + errorCount);
    logger.info('total pages outside limits ' + dontFetchedCount);
  }

}


// Handles creating the object and running build.
// Executes callback() parameter when graph has
// been built, also returns a promise that resolves
// at that same moment.
function graph (url, options, callback) {
  var deferred = _.Deferred(),
      promise  = deferred.promise(),
      err = null,
      grapher;

  if (arguments.length == 2 && _.isFunction(options)) {
    callback = options;
    options = {};
  }
  mergeOptions(options);

  // test for email address or url
  if (fn.trim(url) !== '') {
    if (url.indexOf('@') > -1) {
      options.logger.info('parsing webfinger address: ' + url);
      getWebfinger (url, function(err, wfUrl) {
        if (err === null) {
          graphIt(wfUrl);
        } else {
          returnError('Could not find any pages with webfinger address: ' + url);
        }
      });
    } else { 
      try {
        graphIt(url);
      }
      catch (err) {
        returnError(err);
      }
    }
  } else {
    returnError('Sorry no url given');
  }


  function graphIt (url) {
    grapher = new Grapher(url, options);
    grapher.build(function (err, graph) {
      // if we have an error reformat object
      if (callback) {
        callback( err, graph.toLiteral(err) );
      }
      deferred.resolve(err, graph.toLiteral(err) );
    });
  }

  function returnError(msg, url){
      var responseObj = {
        "query": url,
        "created": new Date().toJSON(),
        "crawled": 0,
        "verified": 0,
      }
      options.logger.error(msg);
      if (callback) {callback(msg, responseObj);}
      deferred.resolve(msg, responseObj);
  }

  return promise;
}


// use webfinger to get a url with xfn
function getWebfinger(address, callback){
  try {
    wf.webfinger (address, function(msg, data) {
      if (data && data.links) {
        var objs = data.links,
          i = objs.length,
          found = false;
          x = 0;
        while (x < i) {
          // if we find a page that contains xfn ie a possible rel=me
          if (objs[x].rel === 'http://gmpg.org/xfn/11') {
            callback(null, objs[x].href);
            found = true;
            break;
          }
          x++;
        }
        if (!found) callback('No XFN data webfinger request', null);
      } else {
        callback('No data from webfinger request', null);
      }   
    });
  }
  catch (err) {
    callback(err, null);
  }
}


// merges passed and default options
function mergeOptions (options) {
  // add interface for cache and logger
  options.cache = (options.cache)? options.cache : internalCache;
  options.logger = (options.logger)? options.logger : internalLogger;

  // single level clone of missing properties
  for (var key in internalOptions) {
    if (internalOptions.hasOwnProperty(key)) {
      if (!options.hasOwnProperty(key)) {
        options[key] = internalOptions[key];
      }
    }
  }
  // set options within cache and logger objects
  if(options.logger.setLogLevel){
    options.logger.setLogLevel( options.logLevel );
  }
  if(options.cache.setCacheLimits){
    options.cache.setCacheLimits( options.cacheTimeLimit, options.cacheItemLimit, options.logger );
  }
}



exports.Grapher = Grapher;
exports.graph = graph;
exports.cache = Grapher.cache;
exports.options = internalOptions;
