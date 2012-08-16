var _       = require('underscore')._,
    cache   = require('./cache.js'),
    scraper = require('./scraper.js'),
    fn      = require('./functions.js');

function arrayHas (arr, val) {return arr.indexOf(val) !== -1};

/**
 * The Page object. Stores important scraped information
 * such as 'rel=me' links, the url they were found on as
 * well as the favicon.
 */
function Page (url, grapher, sourceUrl) {
  this.url       = url;
  this.title     = "";
  this.favicon   = "";
  this.links     = [];
  this.status    = "unfetched";
  this.valid     = false;
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
      self.addPages(self.links, self.url);
      self.status = "fetched";
      callback();
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
  validate: function () { // DEPRICATED
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

  toLiteral: function (props) {
    var rtnObj = {};

    if (arrayHas(props, 'url')) {
      rtnObj['url'] = this.url;
    }

    if (arrayHas(props, 'title')) {
      rtnObj['title'] = this.title;
    }

    if (arrayHas(props, 'favicon')) {
      rtnObj['favicon'] = this.favicon;
    }

    if (arrayHas(props, 'links')) {
      rtnObj['links'] = this.links;
    }

    if (arrayHas(props, 'valid')) {
      rtnObj['valid'] = this.valid;
    }

    return rtnObj;

    /*return {
      url:       this.url,
      title:     this.title,
      favicon:   this.favicon,
      links:     this.links,
      valid:     this.valid
    };*/
  }
}

exports.Page = Page;