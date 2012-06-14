var http    = require('http'),
	_ 		= require('underscore')._,
	globals = require('./globals.js');

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

	require('./grapher.js').graph('http:/'+req.url).then(function(obj) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(obj));
	});

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');