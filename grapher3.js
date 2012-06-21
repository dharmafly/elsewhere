var _     = require('underscore')._,
  jsdom   = require('jsdom'),
  globals = require('./globals.js');

_.mixin(require('underscore.deferred'));

function sameUrl (url1, url2) {

  // remove www if www is present
  url1 = removeWWW(url1);
  url2 = removeWWW(url2);

  // remove trailing slash if one is present
  url1 = removeTrailingSlash(url1);
  url2 = removeTrailingSlash(url2);

  return url1 === url2;
}

function removeWWW (a) {
  return a.search('www') !== -1 ? a.substring(0,7) + a.substring(11,a.length) : a;
}

function removeTrailingSlash (a) {
  return a[a.length-1] === "/" ? a.substring(0,a.length-1) : a;
}

function Grapher (url) {
  this.rootUrl   = url;
  this.validUrls = [url];
  this.pages     = {};
}

Grapher.prototype = {
  
  constructor: Grapher,
  validUrls: [],

  build: function (callback) {
    this.pages[this.rootUrl] = new Page(this.rootUrl, this);
    process.stdout.write('\nfetching ' + this.rootUrl + "\n");
    this.fetchPages(callback);
  },

  toJSON: function () {
    var self = this;
    return JSON.stringify(_.map(self.validUrls, function (url) {
      var page = self.pages[url];
      return {
        url:     url,
        title:   page.title,
        favicon: page.favicon
      }
    }));
  },

  addPages: function (newLinks) {
    var existingLinks = _.pluck(this.pages, 'url'),
        self          = this,
        notAlreadyUsed;

    _.each(newLinks, function (newLink) {
      
      if (self.pages[newLink]) {
        return;
      } else {
        alreadyUsed = _.any(existingLinks, function (existingLink) {
          return sameUrl(newLink, existingLink);
        });
        if (!alreadyUsed) {
          self.pages[newLink] = new Page(newLink, self);
        } 
      }
    });
    
    /*
    var self = this,
        alreadyUsed;

    _.each(newLinks, function (newLink) {
      if (!self.pages[newLink]) {
        self.pages[newLink] = new Page(newLink, self);
      }
    });*/
  },

  allFetched: function () {
    var statuses = _.pluck(this.pages, 'status');

    return _.all(statuses, function (status) {
      return status === "fetched";
    });
  },

  fetchPages: function (callback) {
    var self         = this,
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

function Page (url, grapher) {
  this.url     = url;
  this.title   = "";
  this.favicon = "";
  this.links   = [];
  this.status  = "unfetched";
  this.valid   = null;
  this.grapher = grapher;
}

Page.prototype = {

  constructor: Page,

  validate: function () {
    var self = this;

    self.valid = _.any(self.grapher.validUrls, function (validUrl) {
      return _.include(self.links, validUrl);
    });

    if (self.valid && !_.include(self.grapher.validUrls, self.url)) {
      self.grapher.validUrls.push(self.url);
    }

    return this.valid;
  },

  fetch: function (callback) {
    var self = this;

    self.status = "fetching";

    jsdom.env(self.url, [
      globals.JQUERY_URI
    ],
    function(errors, window) {
      if (!errors) {
        window.$("a[rel~=me]").each(function (i, elem) {
          if (elem.href.substring(0,1) !== '/') {
            self.links.push(elem.href);
          }
        });

        self.title = window.document.title;
        self.resolveFavicon(window);
        self.validate();
        self.grapher.addPages(self.links);
        self.status = "fetched";

        callback();
      } else {
        self.status = "error";
        console.log(errors);
        callback();
      }

      // release memory used by window object
      if (window) window.close();
    });
  },

  resolveFavicon: function (window) {
    var favicon   = window.$('link[rel="shortcut icon"]'),
        url       = require('url').parse(this.url),
        rootUrl   = url.protocol + "//" + url.host;

    if (favicon.length > 0) {
      favicon = favicon[0].href;

      if (favicon.substring(0,2) === "//") {
        this.favicon = url.protocol + favicon;
      } else if (favicon.substring(0,1) === "/") {
        this.favicon = url.protocol + favicon;
      } else {
        this.favicon = favicon;
      }

    } else {
      this.favicon = rootUrl + "/favicon.ico";
    }

    return this.favicon;
  }
}

exports.Grapher = Grapher;