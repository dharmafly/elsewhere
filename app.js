var app      = require('http').createServer(handler),
    fs       = require('fs'),
    globals  = require('./globals.js'),
    graphMod = require('./grapher.js'),
    _        = require('underscore')._;

function handler(req, res) {
  var rtn = [], grapher;
  
  // if the request if for a favicon, ignore it.
  if (req.url === '/favicon.ico') {
    res.end();
    return;
  }

  // if the root is requested then display instructions.
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile('index.html', function (err, page) {
      if (err) throw err;
      res.end(page);
    });
    return;
  }

  // If the request didn't contain a query string then provide the
  // grapher with the path. Otherwise disect the query string.
  var args = require('url').parse(req.url, true).query;

  if (_.isEmpty(args)) {
    grapher = new graphMod.Grapher('http:/'+req.url, {strict:true});
  } else {
    var urlBits = require('url').parse(args.q, true),
        url;
    
    if (urlBits.protocol) {
      url = urlBits.href;
    } else {
      url = "http://" + urlBits.href;
    }

    grapher = new graphMod.Grapher(url, {strict:(args.strict !== undefined)});
  }

  // Once grapher object is instantiated, build the graph.
  grapher.build(function() {
    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(grapher.toJSON());
  });
}

app.listen(globals.APP_PORT, globals.APP_IP);

console.log('App @ http://' + globals.APP_IP + ':' + globals.APP_PORT);