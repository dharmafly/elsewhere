var _       = require('underscore')._,
    jsdom   = require('jsdom'),
    globals = require('./globals.js'),
    cache   = require('./cache.js');

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
   * Uses jsdom to scrape a page for 'rel=me' links, the title
   * of the page, and its favicon. If the page is already in
   * module's cache object then the chached copy is returned.
   */
  fetch: function (callback) {
    var self = this,
        cached;

    self.status = "fetching";

    if (cached = cache.get(self.url)) {
      self.title = cached.title;
      self.links = cached.links;
      self.favicon = cached.favicon;
      //self.validate();
      //self.addPages(self.links, self.url);

      if (self.validate()) {
        self.addPages(self.links, self.url);
      }

      self.status = "fetched";
      callback();
      return;
    }

    jsdom.env(self.url, [
      globals.JQUERY_URI
    ],
    function(errors, window) {
      if (!errors) {
        
        // get links
        window.$("a[rel~=me]").each(function (i, elem) {
          if (elem.href.substring(0,1) !== '/') {
            self.links.push(elem.href);
          }
        });

        // get the title
        self.title = window.document.title.replace(/(\r\n|\n|\r)/gm,"").trim();

        // get the favicon
        self.resolveFavicon(window);

        // validate the page
        if (self.validate()) {
          self.addPages(self.links, self.url);
        }
        
        self.status = "fetched";

        cache.set(self.url, {
          title   : self.title,
          links   : self.links,
          favicon : self.favicon
        });

        callback(null, self);
      } else {
        self.status = "error";
        //console.log(self.url, errors);
        callback(errors, self);
      }

      // release memory used by window object
      if (window) window.close();
    });
  },

  /**
   * If in strict mode will return true if this Page links
   * back to a url in `this.grapher.validUrls`. If not in
   * strict mode then always returns true.
   */
  validate: function () {
    var self = this;

    // if the grapher is in non-strict mode then this
    // page is automatically valid.
    if (self.grapher.options.strict === false) {
      self.valid = true;
    
    // if this page's url is on the list of valid urls
    // then it is valid.
    } else if (_.include(self.grapher.validUrls, self.url)) {
      self.valid = true;

    // if this page contains any links that are on the list
    // of valid urls then the page is valid
    } else {
      self.valid = _.any(self.grapher.validUrls, function (validUrl) {
        return _.include(self.links, validUrl);
      });
    }

    // if the page has been validated and is not already
    // on the list of valid urls then add it to the list.
    if (self.valid && !_.include(self.grapher.validUrls, self.url)) {
      self.grapher.validUrls.push(self.url);
    }

    return self.valid;
  },

  /**
   * Used by `Page.fetch` to add new Page objects to the Grapher
   * for each link which has not yet been fetched.
   */
  addPages: function (newLinks, sourceUrl) {
    var grapher = this.grapher;

    _.each(newLinks, function (newLink) {
      if (!grapher.alreadyUsed(newLink)) {
        grapher.pages[newLink] = new Page(newLink, grapher, sourceUrl);
      }
    });
  },

  /**
   * Scrapes the favicon from the page if there is one,
   * if not then defaults to /favicon.ico. Should always
   * return a full URL.
   */
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