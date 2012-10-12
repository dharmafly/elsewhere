--- 
heading: The Graph Method
category: reference
---
The `graph` method takes the following three parameters.

**url** This is the url that you wish to graph. The assumption is that it represents a person and has `rel=me` links to other urls also representing that person.

**options** (optional) This object literal contains properties used to configure the graph. The properties that can be passed into the  'graph' method are the same as those used in the global options: 'strict', 'logLevel', 'crawlLimit', 'domainLimit', 'stripDeeperLinks', 'cacheTimeLimit' and 'cacheItemLimit'.

**callback** (optional) The function provided as this parameter will be called once the graph has been completely constructed. The callback is provided with one parameter: a completed `Graph` object.

Here are some examples of valid calls to the graph method.

    var options = {
        strict: true
    }

    var callback = function (graph) {};

    elsewhere.graph('http://premasagar.com', options, callback);

    elsewhere.graph('http://chrisnewtn.com', callback);

    elsewhere.graph('http://glennjones.net').then(callback);