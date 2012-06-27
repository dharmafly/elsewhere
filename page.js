var _     = require('underscore')._,
    jsdom   = require('jsdom'),
    globals = require('./globals.js'),
    cache   = {};

/**
 * The Page object. Stores important scraped information
 * such as 'rel=me' links, the url they were found on as
 * well as the favicon.
 */
function Page (url, grapher, sourceUrl) {
  this.url     = url;
  this.title   = "";
  this.favicon = "";
  this.links   = [];
  this.status  = "unfetched";
  this.valid   = null;
  this.grapher = grapher;
  this.sourceUrl = sourceUrl;
}

Page.prototype = {

  constructor: Page,

  /**
   * If in strict mode will return true if this Page links
   * back to a url in `this.grapher.validUrls`. If not in
   * strict mode then always returns true.
   */
  validate: function () {
    var self = this;

    self.valid = _.any(self.grapher.validUrls, function (validUrl) {
      return _.include(self.links, validUrl);
    });

    if (self.grapher.options.strict === false) {
      self.valid = true;
    }

    if (self.valid && !_.include(self.grapher.validUrls, self.url)) {
      self.grapher.validUrls.push(self.url);
    }

    return this.valid;
  },

  /**
   * Uses jsdom to scrape a page for 'rel=me' links, the title
   * of the page, and its favicon. If the page is already in
   * module's cache object then the chached copy is returned.
   */
  fetch: function (callback) {
    var self = this;

    self.status = "fetching";

    if (cache[self.url]) {
      var cached = cache[self.url];
      self.title = cached.title;
      self.links = cached.links;
      self.favicon = cached.favicon;
      self.validate();
      self.grapher.addPages(self.links, self.url);
      self.status = "fetched";
      callback();
      return;
    }

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
        self.grapher.addPages(self.links, self.url);
        self.status = "fetched";

        cache[self.url] = {
          title   : self.title,
          links   : self.links,
          favicon : self.favicon
        };

        callback();
      } else {
        self.status = "error";
        console.log(self.url, errors);
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
        this.favicon = rootUrl + favicon;
      } else {
        this.favicon = favicon;
      }

    } else {
      this.favicon = rootUrl + "/favicon.ico";
    }

    return this.favicon;
  }
}

exports.Page = Page;