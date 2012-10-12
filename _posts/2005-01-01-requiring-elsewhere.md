--- 
heading: Requiring Elsewhere
category: reference
---

Elsewhere is available on [NPM][npm]. To install it, run:

    npm install elsewhere

Once you have it installed, you can [require()][require] it and interact with it using the `graph()` method.

    var elsewhere = require('elsewhere');

    elsewhere.graph('http://premasagar.com').then(function (graph) {
        res.end(graph.toJSON());
    });


[npm]: https://npmjs.org/package/elsewhere
[require]: http://nodejs.org/api/globals.html#globals_require