var _ 		= require('underscore')._,
	jsdom   = require('jsdom'),
	globals = require('./globals.js');

_.mixin( require('underscore.deferred') );

var Grapher = function () {
	this.count = 0; 
	this.total = 0;
	this.confirmedLinks = [];
	this.traversedLinks = [];
	this.traversedLinkObjects = {};
	this.graph = {};
	this.took;
};

Grapher.prototype.buildGraph = function(path) {
	var deferred = _.Deferred(),
		promise  = deferred.promise(),
		rtn = {},
		me = this,
		buildingLinkObjects = [];

	console.log("Building graph for " + path);

	me.confirmedLinks.push(path);
	me.took = new Date().getTime();

	me.getLinks(path)
	.then(function(obj) {

		me.count = 0;
		me.total = obj.links.length;
		rtn = obj;

		me.buildConnections(obj)
		.fail(function(error) {
			console.log(JSON.stringify(error));
		})
		.pipe(function() {
			rtn.links = me.findConfirmedLinkObjects(arguments);
			//me.traversedLinks.push(path);
			
			me.buildObjConnections(rtn.links).then(function() {
				rtn.builtObjectConnections = arguments;
				rtn.confirmed = me.confirmedLinks;
				rtn.took = new Date().getTime() - me.took;
				deferred.resolve(rtn);
			});
			/*
			rtn.confirmed = me.confirmedLinks;
			rtn.took = new Date().getTime() - me.took;

			deferred.resolve(rtn);*/
		});
	});

	return promise;
}

Grapher.prototype.buildObjConnections = function(linkObjects) {
	var promises = [],
		me       = this;

	linkObjects.forEach(function(linkObject) {
		var deferred = _.Deferred(),
			promise  = deferred.promise();

		if (!_.include(me.traversedLinks, linkObject.root)) {

			console.log("Building " + linkObject.root);

			me.buildConnections(linkObject)
			.fail(function(error) {
				console.log(JSON.stringify(error));
			})
			.pipe(function() {
				console.log("Built " + linkObject.root);
				console.log(me.traversedLinks);

				linkObject.links = me.findConfirmedLinkObjects(arguments);
				me.buildObjConnections(linkObject.links).then(function () {
					deferred.resolve(arguments);
				});
			});
		} else {
			console.log("Already built " + linkObject.root);
			deferred.resolve(arguments);
		}

		promises.push(promise);
	});

	return _.when.apply(_, promises);
}

Grapher.prototype.findConfirmedLinkObjects = function(linksArray) {
	var confirmedArray   = [],
		unconfirmedArray = [],
		me = this;

	process.stdout.write("Confirming links...\r");

	_.each(linksArray, function(link, i) {
		if(me.confirmed(link)) {
			if(!_.include(me.confirmedLinks, link.root)) {
				me.confirmedLinks.push(link.root);
			}
			confirmedArray.push(link);
		} else {
			unconfirmedArray.push(link);
		}
	});

	process.stdout.write("Confirming links... found " + confirmedArray.length + " \n");

	if (confirmedArray.length > 0) {
		return confirmedArray.concat(me.findConfirmedLinkObjects(unconfirmedArray));
	} else {
		return confirmedArray;
	}
};

Grapher.prototype.confirmed = function(linksObject) {
	var rtn = false,
		me  = this;

	_.each(linksObject.links, function(unconfirmedLink) {
		if (_.include(me.confirmedLinks, unconfirmedLink)) {
			rtn = true;
		}
	});

	return rtn;
};

Grapher.prototype.buildConnections = function(obj) {
	var promises = [],
		me       = this;

	obj.links.forEach(function (url) {
		if (url.search(new RegExp ('^(http|https)://')) !== -1) {
			promises.push(me.getLinks(url));
		}
	});

	return _.when.apply(_, promises);
};

Grapher.prototype.getLinks = function(path) {
	var deferred = _.Deferred(),
		promise  = deferred.promise(),
		me       = this,
		obj      = {
			root: path,
			links:[]
		};

	if (_.include(me.traversedLinks, path)) {
		deferred.resolve(me.traversedLinkObjects[path]);
		return promise;
	}

	console.log("Scanning " + path + "...");

	jsdom.env(path, [
		globals.JQUERY_URI
	],
	function(errors, window) {

		if (!errors) {
			window.$("a").each(function(i, val) {
				if (window.$(val).attr('rel').search('me') !== -1) {
					if (window.$(val).attr('href') !== '/') obj.links.push(window.$(val).attr('href'));
				}
			});

			me.count++;
			process.stdout.write(" "+me.count + "/" + me.total + " Found " + 
				obj.links.length + " links @ " + path.substring(0,40) + "\r");

			me.traversedLinks.push(path);
			me.traversedLinkObjects.push(obj);
			deferred.resolve(obj);
		} else {
			console.log("Error! " + JSON.stringify(errors));
			deferred.reject(errors);
		}
	});

	return promise;
};

exports.Grapher = Grapher;