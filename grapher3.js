var _     = require('underscore')._,
  jsdom   = require('jsdom'),
  globals = require('./globals.js');

_.mixin(require('underscore.deferred'));

function Grapher (url) {
  this.rootUrl = url;
  this.validUrls = [url];
}

Grapher.prototype = {
  
  constructor : Grapher,
  pages: {},
  validUrls: [],

  build: function (callback) {
    this.pages[this.rootUrl] = new Page(this.rootUrl, this);
    this.fetchPages(callback);
  },

  toJSON: function () {
    var self = this;
    return JSON.stringify(_.map(self.validUrls, function (url) {
      var page = self.pages[url];
      return {
        url: url,
        title: page.title,
        favicon: page.favicon
      }
    }));
  },

  fetchPages: function (callback) {
    var self     = this,
        statuses = [],
        whenFetched;

    whenFetched = function () {
      statuses = _.pluck(self.pages, 'status');

      console.log(statuses);

      var allFetched = _.all(statuses, function (s) {
        return s === "fetched";
      });

      if (allFetched) {
        console.log('all fetched');
        callback();
      } else {
        self.fetchPages(callback);
      }
    }

    _.each(this.pages, function (page) {
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

  validate: function (validUrls) {
    var self = this;
    return this.valid = _.any(validUrls, function (validUrl) {
      return _.include(self.links, validUrl);
    });
  },

  fetch: function (callback) {
    var self = this;

    self.status = "fetching";
    //console.log("Fetching " + self.url);

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

        var favicon = window.$('link[rel="shortcut icon"]');
        
        self.favicon = favicon.length > 0 ? favicon[0].href : "";
        

        if (self.validate(self.grapher.validUrls)) {
          if (!_.include(self.grapher.validUrls, self.url)) {
            self.grapher.validUrls.push(self.url);
          }
        }

        _.each(self.links, function (link) {
          if (!self.grapher.pages[link]) self.grapher.pages[link] = new Page(link, self.grapher);
        });

        self.status = "fetched";
        callback(self);
        //console.log("Fetched " + self.url);
      } else {
        //console.log("Error! " + JSON.stringify(errors));
        callback(errors);
      }
    });
  }
}

exports.Grapher = Grapher;