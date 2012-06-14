var _ 		= require('underscore')._,
	jsdom   = require('jsdom'),
	globals = require('./globals.js'),
	count = 0, 
	total = 0,
	confirmedLinks = [];

_.mixin( require('underscore.deferred') );

function graph(path) {
	var deferred = _.Deferred(),
		promise  = deferred.promise();

	console.log("Building graph for " + path);

	findMeLinks(path)
	.then(function(obj) {

		count = 0;
		total = obj.links.length;
		confirmedLinks.push(obj.root);

		buildConnections(obj.links)
		.fail(function(error) {
			console.log(JSON.stringify(error));
		})
		.pipe(function() {

			console.log("");

			rtn = obj;
			rtn.links = findConfirmedLinkObjects(arguments);
			rtn.confirmedLinks = confirmedLinks;

			deferred.resolve(rtn);

			console.log("Done building graph.");
		});
	});

	return promise;
}

function findConfirmedLinkObjects(linksArray) {
	var confirmedArray   = [],
		unconfirmedArray = [];

	process.stdout.write("Confirming links...\r");

	_.each(linksArray, function(link, i) {
		if(confirmed(link)) {
			if(!_.include(confirmedLinks, link.root)) {
				confirmedLinks.push(link.root);
			}
			confirmedArray.push(link);
		} else {
			unconfirmedArray.push(link);
		}
	});

	process.stdout.write("Confirming links... found " + confirmedArray.length + " \n");

	if (confirmedArray.length > 0) {
		return confirmedArray.concat(findConfirmedLinkObjects(unconfirmedArray));
	} else {
		return confirmedArray;
	}
}

function confirmed(linksObject) {
	var rtn = false;
	_.each(linksObject.links, function(unconfirmedLink) {
		if (_.include(confirmedLinks, unconfirmedLink)) {
			rtn = true;
		}
	});
	return rtn;
}

function buildConnections(paths) {
	var promises = [];

	paths.forEach(function (url) {
		if (url.search(new RegExp ('^(http|https)://')) !== -1) {
			promises.push(findMeLinks(url));
		}
	});

	return _.when.apply(_, promises);
}

function findMeLinks(path) {
	var deferred = _.Deferred(),
		promise = deferred.promise(),
		obj = {
			root: path,
			links:[]
		};

	//console.log("Searching " + path + "...");

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

			count++;
			process.stdout.write(" "+count + "/" + total + " Found " + 
				obj.links.length + " links @ " + path.substring(0,40) + "\r");

			deferred.resolve(obj);
		} else {
			console.log("Error! " + JSON.stringify(errors));
			deferred.reject(errors);
		}
	});

	return promise;
}

exports.graph = graph;