var _     = require('underscore')._,
  jsdom   = require('jsdom'),
  globals = require('./globals.js');

_.mixin(require('underscore.deferred'));

// Used for converting a Node object into something that
// JSON.stringify can consume.
function serializeNode (node) {
  return {
    url: node.url,
    links: node.links,
    traversedUrls: node.traversedUrls,
    nodes: serializeNodes(node.nodes),
    valid: node.valid(),
  };
}

// Converts all the Nodes in a structure into something
// that JSON.stringify can consume
function serializeNodes (nodes) {
  if (_.isArray(nodes)) {
    return _.map(nodes, function (node) {
      return serializeNode(node);
    });
  } else {
    return serializeNode(nodes);
  }
}

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

// The grapher object; directs the node object(s) to build
// a graph of a person.
var Grapher = function () {
  this.nodes;
};

Grapher.prototype.build = function (url) {
  var deferred = _.Deferred(),
      promise  = deferred.promise()
      node     = new Node(url);

  node.scan().then(function () {
    node.scanSubnodes().then(function () {
      deferred.resolve(node.generateReturnObject());
    });
  });
  /*generateNodeStructure(node).then(function () {
    deferred.resolve(node.generateReturnObject());
  });*/
  /*node.scan().then(function () {
    deferred.resolve(node.generateReturnObject());
  });*/
  
  generateNodeStructure(node)

  return promise;
};

function generateNodeStructure (node) {
  var promises = [];

  promises = _.map(node.nodes, function (thisNode) {
    return node.scan();
  });

  return _.when.apply(_, promises);
}

// The node object; represents the rel=me links on a site.
var Node = function (url) {
  this.url           = url;
  this.links         = [];
  this.nodes         = [];
  this.traversedUrls = [];
  this.parent        = null;
};

Node.prototype.root = function () {
  return this.parent === null ? this : this.parent.root();
}

Node.prototype.siblings = function () {
  var self = this;

  if (self.parent === null) return [];

  return _.filter(self.parent.nodes, function (node) {
    return node.url !== self.url;
  });
}

Node.prototype.valid = function () {
  var self = this;

  return this.parent === null || 
    _.include(this.links, this.root().url) ||
    _.any(this.links, function (link) {
      return _.any(self.root().nodes, function (node) {
        return node.url === link && node.valid();
      });
    });
}

Node.prototype.generateReturnObject = function () {
  return serializeNodes(this);
}

Node.prototype.compactSubnodes = function () {
  this.nodes = _.filter(this.nodes, function (node) {
    return node.links.length > 0;
  });
}

Node.prototype.scanSubnodes = function () {
  var promises = _.map(this.nodes, function (node) {
    return node.scan();
  });

  return _.when.apply(_, promises)
};

Node.prototype.createSubnodes = function () {
  var self = this;

  this.links.forEach(function (link) {
    if (!self.alreadyScanned(link)) {
      var subnode = new Node(link);
      subnode.parent = self;
      self.nodes.push(subnode);
    }
  });
};

Node.prototype.alreadyScanned = function (url) {
  return sameUrl(url, this.url) || 
    _.any(this.root().traversedUrls, function (thisUrl) {
      return sameUrl(thisUrl, url);
    });
}

Node.prototype.scan = function () {
  var deferred = _.Deferred(),
      promise  = deferred.promise(),
      self     = this;

  this.root().traversedUrls.push(self.url);

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
      self.createSubnodes();
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