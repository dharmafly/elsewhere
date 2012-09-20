---
category: reference
heading: The Graph Method
---
The `graph` method takes the following three parameters.

**url** This is the url that you wish to graph. The assumption is that it represents a person and has `rel=me` links to other urls also representing that person.

**options** (optional) This object literal contains a few properties used to configure the graph. These properties are:
  
  - strict (boolean) `true` for strict mode, `false` otherwise. Strict mode only returns urls that link back to either the url provided in the first parameter or another url that does.

  - crawlLimit (integer) The number of links Elsewhere will follow without a successful verification before it abandons the chain. Defaults to 3.

  - stripDeeperLinks (boolean) If set to `true` then Elsewhere will discard links that share a domain with another link or links at a shallower level. E.g. plus.google.com/{id} is kept, while plus.google.com/{id}/posts is discarded.

**callback** (optional) The function provided as this parameter will be called once the graph has been completely constructed. The callback is provided with one parameter: a completed `Graph` object.

Here are some examples of valid calls to the graph method.

    var options = {
      strict: true
    }

    var callback = function (graph) {};

    elsewhere.graph('http://premasagar.com', options, callback);

    elsewhere.graph('http://chrisnewtn.com', callback);

    elsewhere.graph('http://glennjones.net').then(callback);