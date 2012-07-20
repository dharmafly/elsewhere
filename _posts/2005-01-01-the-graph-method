---
category: reference
---
The `graph` method takes the folloing three parameters.

1. `url` This is the url that you wish to graph. The assumption is that it represents a person and has `rel=me` links to other urls also representing that person.

2. `options` (_optional_) This object literal contains a few properties used to configure the graph. At present the only property is strict.
  
  - strict `true` for strict mode, `false` otherwise. Strict mode only returns urls that link back to either the url provided in the first parameter or another url that does.

3. `callback` (_optional_) The function provided as this parameter will be called once the graph has been completely constructed. The callback is fed one parameter: a `Graph` object.

An example call to `graph` looks like this.

    var options = {
      strict: true
    }

    Grapher.graph('http://premasagar.com', options, function (graph) {
      // do something with the graph!!
    });