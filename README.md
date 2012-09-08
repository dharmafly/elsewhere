Node Social Graph
================

Node Social Graph is a Node.js project that aims to replicate the functionality of the Google Social Graph API.

It does this by crawling a target url for `rel=me` [microformated][microformats] links. It then crawls those links for more `rel=me` links and so on, building a comprehensive graph as it goes.

Node Social Graph provides a JSON API that URL's can be easily queried against via client JavaScript. It can also be included as a [Node.js][node] module and used directly in your server projects.

### JSON API

Once you've cloned the project and run an `npm install`, run the server located @ `bin/node-socialgraph` and point your browser at `localhost:8888` to try it out.

To query aginst the example server API in your code, your queries most be formatted like so:

    http://localhost:8888/?url=[url you wish to query]

The JSON it returns looks like this:

    {
      results: [
        {
          url: "http://chrisnewtn.com",
          title: "Chris Newton",
          favicon: "http://chrisnewtn.com/favicon.ico",
          outboundLinks: {
          verified: [ ... ],
          unverified: [ ]
          },
          inboundCount: {
            verified: 4,
            unverified: 0
          },
          verified: true
        }
      ],
      query: "http://chrisnewtn.com",
      created: "2012-09-08T16:30:57.270Z",
      crawled: 9,
      verified: 9
    }

### Using it as a Node Module

To use Node Social Graph as a node module, just clone it into the `node_modules` directory of your project and require it in your source.

    var grapher = require('node-socialgraph');

The example code below builds a graph of `http://premasagar.com` and the [promises][_deferred] interface to render the result.

    grapher.graph('http://premasagar.com').then(function (graph) {
      res.end(graph.toJSON());
    });

The graph method accepts a variety of options. Two of these (`strict` & `stripDeeperLinks`) only govern what toJSON returns and do not affect the graph itself.

* `strict`: If this is set to true then `toJSON` will not return url which are unverified. An unverified url is any url which does not link to any other verified url. The url provided to the graph method is inherently verified.
* `stripDeeperLinks`: If set to true then urls at deeper path depths than that of the shallowest on the same domain will be discarded.
* `crawlLimit` The number of urls that can be crawled in a row without any successful verifications before the crawling of any subsequent urls is abandoned.

The default options as well as some more low level options can be found in `lib/options.js`.

[node]: http://nodejs.org/
[microformats]: http://microformats.org/wiki/rel-me
[_deferred]: https://npmjs.org/package/underscore.deferred