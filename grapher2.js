var _ 		= require('underscore')._,
	jsdom   = require('jsdom'),
	globals = require('./globals.js');

_.mixin( require('underscore.deferred') );

var Graph = function () {
	this.nodes;
}

var Node = function (url) {
	this.url = url;
	this.links = [];
	this.nodes = [];
	this.parent = null;
}

Grapher.prototype.build = function (url) {
	var deferred = _.Deferred(),
		promise  = deferred.promise()
		node     = new Node(url);

	node.scan().then(function () {
		node.createSubNodes();
		node.scanSubNodes().then(function () {
			deferred.resolve(node);
		});
	});

	return promise;
}

/*Node.prototype.build = function () {
	var deferred = _.Deferred(),
		promise  = deferred.promise(),
		me       = this;



	return promise;
}*/

Node.prototype.scanSubNodes = function () {
	var promises = [],
		me       = this;

	this.nodes.forEach(function (node) {
		promises.push(node.scan());
	});

	return _.when.apply(_, promises);
}

Node.prototype.createSubNodes = function () {
	var me = this;

	this.links.forEach(function (link) {
		var subNode = new Node(link);
		subNode.parent = me;
		me.nodes.push(subNode);
	});
}

Node.prototype.scan = function () {
	var deferred = _.Deferred(),
		promise  = deferred.promise(),
		me       = this;

	jsdom.env(path, [
		globals.JQUERY_URI
	],
	function(errors, window) {

		if (!errors) {
			window.$("a").each(function (i, val) {
				if (window.$(val).attr('rel').search('me') !== -1) {
					var href = window.$(val).attr('href');

					if (href !== '/') {
						me.links.push(href);
					}
				}
			});

			deferred.resolve(me);

		} else {
			console.log("Error! " + JSON.stringify(errors));
			deferred.reject(errors);
		}
	});

	return promise;
}