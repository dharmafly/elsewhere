var _     = require('underscore')._,
  jsdom   = require('jsdom'),
  globals = require('./globals.js');

_.mixin( require('underscore.deferred') );

var Grapher = function () {
  this.nodes;
};

var Node = function (url) {
  this.url = url;
  this.links = [];
  this.nodes = [];
  this.traversedUrls = [];
  this.parent = null;
};

Grapher.prototype.build = function (url) {
  var deferred = _.Deferred(),
      promise  = deferred.promise()
      node     = new Node(url);

  node.scan().then(function () {
    node.createSubnodes();
    node.scanSubnodes().then(function () {
      deferred.resolve(node.generateReturnObject());
    });
  });

  return promise;
};

/* make this some cool recursive shit or something / work */
Node.prototype.generateReturnObject = function () {
  var self = this,
      rtn  = {url:self.url,nodes:[]},
      buildRtnObjs;

  buildRtnObjs = function (node) {

  };

  buildRtnObjs(self);

  return rtn;
}

Node.prototype.compactSubnodes = function () {
  var prunedNodes = [];

  _.each(this.nodes, function (node) {
    if (node.links.length > 0) {
      prunedNodes.push(node);
    }
  });

  this.nodes = prunedNodes;
}

Node.prototype.scanSubnodes = function () {
  var promises = [],
      self     = this,
      master;

  this.nodes.forEach(function (node) {
    promises.push(node.scan());
  });

  master = _.when.apply(_, promises);

  // prune all of the traversed links where no
  // links where found before returning it.

  return master
  .pipe(function () {
    var deferred = _.Deferred(),
        promise  = deferred.promise();

    self.compactSubnodes();

    deferred.resolve();

    return promise;
  });
};

Node.prototype.createSubnodes = function () {
  var self = this;

  this.links.forEach(function (link) {
    var subnode = new Node(link);
    subnode.parent = self;
    self.nodes.push(subnode);
  });
};

Node.prototype.scan = function () {
  var deferred = _.Deferred(),
      promise  = deferred.promise(),
      self     = this;

  jsdom.env(self.url, [
    globals.JQUERY_URI
  ],
  function(errors, window) {
    if (!errors) {
      window.$("a").each(function (i, val) {
        if (window.$(val).attr('rel').search('me') !== -1) {
          var href = window.$(val).attr('href');

          if (href !== '/') {
            self.links.push(href);
          }
        }
      });
      deferred.resolve(self);
      console.log("Scanned " + self.url);
    } else {
      console.log("Error! " + JSON.stringify(errors));
      deferred.reject(errors);
    }
  });

  return promise;
};

exports.Grapher = Grapher;