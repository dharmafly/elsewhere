var http    = require('http'),
	Q       = require('q'),
	jsdom = require("jsdom");


http.createServer(function (req, res) {
	var links;

	if (req.url !== '/favicon.ico') {
		links = findMeLinks(req.url);
	} else {
		return;
	}

	res.writeHead(200, {'Content-Type': 'application/json'});

	links.then(function(obj) {
		res.end(JSON.stringify(obj));
	});

}).listen(1337, '127.0.0.1');

function findMeLinks(path) {
	var deferred = Q.defer(),
		obj = {
			links:[]
		};

	jsdom.env('http:/'+path, [
		'http://code.jquery.com/jquery-1.7.2.min.js'
	],
	function(errors, window) {
		if (!errors) {
			window.$("a").each(function(i, val) {
				if (window.$(val).attr('rel').search('me') !== -1) {
					obj.links.push(window.$(val).attr('href'));
				}
			});

			deferred.resolve(obj);
		} else {
			deferred.reject(errors);
		}
	});

	return deferred.promise;
}

console.log('Server running at http://127.0.0.1:1337/');