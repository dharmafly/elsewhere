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
function Page (url, grapher, sourceUrl, level) {
  this.url       = url;
  this.title     = "";
  this.favicon   = "";
  this.links     = [];
  this.status    = "unfetched";
  this.verified  = false;
  this.grapher   = grapher;
  this.sourceUrl = sourceUrl;
  this.level     = level;
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
   * Used by `Page.fetch` to add new Page objects to the Grapher
   * for each link which has not yet been fetched.
   */
  addPages: function (newLinks, sourceUrl) {
    var grapher = this.grapher,
        level   = this.level + 1;

    _.each(newLinks, function (newLink) {
      if (!grapher.alreadyUsed(newLink)) {
        grapher.pages[newLink] = new Page(newLink, grapher, sourceUrl, level);
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

    if (arrayHas(props, 'verified')) {
      rtnObj['verified'] = this.verified;
    }

    if (arrayHas(props, 'level')) {
      rtnObj['level'] = this.level;
    }

    return rtnObj;
  }
}

exports.Page = Page;