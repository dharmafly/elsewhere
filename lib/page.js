var _       = require('underscore')._,
    globals = require('./globals.js'),
    cache   = require('./cache.js'),
    scraper = require('./scraper.js'),
    fn      = require('./functions.js');

/**
 * The Page object. Stores important scraped information
 * such as 'rel=me' links, the url they were found on as
 * well as the favicon.
 */
function Page (url, grapher, sourceUrl) {
  this.url       = url;
  this.title     = "";
  this.favicon   = "";
  //this.siteName  = null;
  this.links     = [];
  this.status    = "unfetched";
  this.valid     = null;
  this.grapher   = grapher;
  this.sourceUrl = sourceUrl;
}

Page.prototype = {

  constructor: Page,

  fetch: function (callback) {
    var self = this,
        cached, populate;

    self.status = "fetching";

    populate = function (errors, data) {
      self.title = data.title;
      self.links = data.links;
      self.favicon = data.favicon;
      //self.siteName = data.siteName;

      if (self.validate()) {
        self.addPages(self.links, self.url);
      }

      self.status = "fetched";
      callback();
      return;
    };

    if (cache.has(self.url)) {
      cache.fetch(self.url, populate);
    } else {
      scraper.scrape(self.url, populate);
    }
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
        return _.any(self.links, function (link) {
          return fn.sameUrl(link, validUrl);
        });
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

  toJSON: function () {
    return {
      url:       this.url,
      title:     this.title,
      favicon:   this.favicon
      //site_name: this.siteName
    };
  }
}

exports.Page = Page;