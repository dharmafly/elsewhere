var _         = require('underscore')._,
    cache     = require('./cache.js'),
    scraper   = require('./scraper.js'),
    fn        = require('./functions.js'),
    urlParser = require('url');

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
      self.grapher.verifyPages();
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
        level   = (this.verified ? 1 : this.level + 1);

    //console.log(this.verified, level);

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
      rtnObj['outboundLinks'] = this.getVerifiedLinksObject();
    }

    if (arrayHas(props, 'inboundCount')) {
      rtnObj['inboundCount'] = this.countInboundLinks();
    }

    if (arrayHas(props, 'verified')) {
      rtnObj['verified'] = this.verified;
    }

    if (arrayHas(props, 'level')) {
      rtnObj['level'] = this.level;
    }

    if (arrayHas(props, 'sourceUrl')) {
      rtnObj['sourceUrl'] = this.sourceUrl;
    }

    return rtnObj;
  },

  countInboundLinks: function () {
    var self       = this,
        selfDomain = urlParser.parse(self.url).hostname,
        rtnObj     = {verified:0,unverified:0};

    _.each(self.grapher.pages, function (page) {
      var pageDomain = urlParser.parse(page.url).hostname,
          isIncluded = _.any(page.links, function (link) {
            return fn.sameUrl(link, self.url);
          });

      if (isIncluded && pageDomain !== selfDomain) {
        if (page.verified) {
          rtnObj.verified++;
        } else {
          rtnObj.unverified++;
        }
      }
    });

    return rtnObj;
  },

  // returns a page's links sorted into 'verified'
  // and 'unverified' arrays
  getVerifiedLinksObject: function () {
    var self   = this,
        rtnObj = {verified:[],unverified:[]};

    // sort the links
    self.links.filter(function (link) {
      if (self.grapher.verifiedLink(link)) {
        rtnObj.verified.push(link);
      } else {
        rtnObj.unverified.push(link);
      }
    });

    // remove duplicates
    rtnObj.verified   = _.uniq(rtnObj.verified);
    rtnObj.unverified = _.uniq(rtnObj.unverified);

    return rtnObj;
  }
}

exports.Page = Page;