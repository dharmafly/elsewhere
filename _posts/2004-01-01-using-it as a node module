---
category: reference
---
use node-socialgraph as a node module, first require it the same way you would any other module, with the require function.

    var Grapher = require('node-socialgraph');

Once you have it in a variable the main method for generating a graph of a url is using the `graph` function.

    Grapher.graph('http://premasagar.com')

There are two methods of accessing the resulting graph: callbacks and promises.

### Callbacks
    
    var options = {};

    Grapher.graph('http://premasagar.com', options, function (graph) {
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
      res.end(graph.toJSON());
    });

### Promises

    Grapher.graph('http://premasagar.com')

    .then(function (graph) {
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
      res.end(graph.toJSON());
    })
    