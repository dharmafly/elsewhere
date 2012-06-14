var http    = require('http'),
	_ 		= require('underscore')._
	jsdom   = require('jsdom'),
	globals = require('./globals.js'),
	count = 0, 
	total = 0;

_.mixin( require('underscore.deferred') );

http.createServer(function (req, res) {
	var rtn = [], master;

	if (req.url === '/favicon.ico') {
		return;
	}

	if (req.url === '/') {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end('<p>Type in a domain and path into the address bar e.g.</p>'+
			'<pre>http://thiswebsite.com/twitter.com/mrbgfx</pre>' +
			'<p>The result will be returned as JSON</p>');
		return;
	}

	findMeLinks('http:/'+req.url)
	.then(function(obj) {

		count = 0;
		total = obj.links.length;

		master = buildConnections(obj.links);

		master.fail(function(error) {
			console.log(JSON.stringify(error));3
		})
		.pipe(function() {

			rtn = obj;
			rtn.links = [];

			_.each(arguments, function(link, i) {
				if(link.links.length > 0) rtn.links.push(link);
			});

			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify(rtn));

			console.log("Data served as JSON.");
		});
	});

}).listen(1337, '127.0.0.1');

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
		/*timeout,*/
		obj = {
			root: path,
			links:[]
		};

	console.log("Searching " + path + "...");

	/*timeout = setTimeout(function() {
		deferred.reject("Connection Dropped for " + path);
	}, 10000);*/

	jsdom.env(path, [
		globals.JQUERY_URI
	],
	function(errors, window) {
		//clearTimeout(timeout);

		if (!errors) {
			window.$("a").each(function(i, val) {
				if (window.$(val).attr('rel').search('me') !== -1) {
					if (window.$(val).attr('href') !== '/') obj.links.push(window.$(val).attr('href'));
				}
			});

			count++;
			console.log(count + "/" + total + " Found " + obj.links.length + " links @ " + path);

			deferred.resolve(obj);
		} else {
			console.log("Error! " + JSON.stringify(errors));
			deferred.reject(errors);
		}
	});

	return promise;
}

console.log('Server running at http://127.0.0.1:1337/');