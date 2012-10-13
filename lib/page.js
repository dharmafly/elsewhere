var _         = require('underscore')._,
    scraper   = require('./scraper.js'),
    fn        = require('./functions.js'),
    urlParser = require('url');

function arrayHas (arr, val) {return arr.indexOf(val) !== -1};

/**
 * The Page object. Stores important scraped information
 * such as 'rel=me' links, the url they were found on as
 * well as the favicon.
 */
function Page (url, grapher, logger, sourceUrl, level) {
  this.url         = url;
  this.title       = "";
  this.favicon     = "";
  this.requestTime = 0;
  this.links       = [];
  this.status      = "unfetched";
  this.verified    = false;
  this.grapher     = grapher;
  this.logger      = logger;
  this.sourceUrl   = sourceUrl;
  this.level       = level;
  this.errors      = [];

  // add the domain from url into count
  grapher.appendDomainCount(url);
}

Page.prototype = {

  constructor: Page,

  fetch: function (cache, callback) {
    var self = this, 
        populate;

    this.status = "fetching";

    // if we have a valid url that can be parsed
    if(urlParser.parse(self.url).hostname){

      populate = function (error, data) {
        if(!errors){
          self.title = data.title;
          self.links = data.links;
          self.favicon = data.favicon;
          self.requestTime = data.requestTime;
          self.grapher.verifyPages();
          self.addPages(self.links, self.url);
          self.status = "fetched";
        }else{
          self.errors.push(error);
          self.status = "errored";
        }
        callback();
      };

      scraper.scrape(this.url, cache, this.logger, populate);
    }else{
      this.logger.warn('url failed to parse correctly: ' + this.url);
      this.errors.push({error: 'url failed to parse correctly: ' + this.url});
      this.status = "errored";
      callback();
    }


  },


  /**
   * Used by `Page.fetch` to add new Page objects to the Grapher
   * for each link which has not yet been found.
   */
  addPages: function (newLinks, sourceUrl) {
    var grapher = this.grapher,
        logger = this.logger,
        level   = (this.verified ? 1 : this.level + 1);

    _.each(newLinks, function (newLink) {
      if (!grapher.alreadyUsed(newLink)) {
        if (!grapher.aboveDomainLimit(newLink)) {
            grapher.pages[newLink] = new Page(newLink, grapher, logger, sourceUrl, level);
          }else{
            logger.log('excluded above domain limit: ' + newLink);
          }
        }else{
          logger.log('excluded already has a page object: ' + newLink);
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