Elsewhere
================

Elsewhere is a Node.js project that aims to replicate the functionality of the Google Social Graph API.

It does this by crawling a target url for `rel=me` [microformated][microformats] links. It then crawls those links for more `rel=me` links and so on, building a comprehensive graph as it goes.

Elsewhere provides a JSON API that URL's can be easily queried against via client JavaScript. It can also be included as a [Node.js][node] module and used directly in your server projects.

### JSON API

Once you've cloned the project and run an `npm install`, run the server located @ `bin/elsewhere` and point your browser at `localhost:8888` to try it out.

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

To use Elsewhere as a node module, just clone it into the `node_modules` directory of your project and require it in your source.

    var elsewhere = require('elsewhere');

The example code below builds a graph of `http://premasagar.com` and the [promises][_deferred] interface to render the result.

    elsewhere.graph('http://premasagar.com').then(function (graph) {
      res.end(graph.toJSON());
    });
 
The graph method accepts a variety of options. Two of these (`strict` & `stripDeeperLinks`) only govern what toJSON returns and do not affect the graph itself.

* `strict`: If this is set to true then `toJSON` will not return url which are unverified. An unverified url is any url which does not link to any other verified url. The url provided to the graph method is inherently verified.
* `stripDeeperLinks`: If set to true then urls at deeper path depths than that of the shallowest on the same domain will be discarded.
* `crawlLimit` The number of urls that can be crawled in a row without any successful verifications before the crawling of any subsequent urls is abandoned.
* `domainLimit` The number of links crawled within one domain before the crawling of any subsequent links is abandoned.

The default options as well as some more low level options can be found in `lib/options.js`.

### Custom Cache

Elsewhere use an in memory cache to store the html of web pages. The options object contains a property called 'cacheTimeLimit' which can be use to set the refresh gap, by default it is set 360000ms. The number of items stored in the cache can be limited using the options property 'cacheItemLimit' by default its is set to a 1000 items.

You can replace the cache with your own functionally if you want store the cached date in a database or file system. To add you own custom cache all you need to do is provide an object contain the following interface:

  {
    function get (url) {
      // add code to get data
      returns data
    }

    function has(url) {
      // add code to check your data store
      returns true or false
    }

    function fetch (url, callback) {
      // add code to return data
      fires callback(null, data);
    }

    function set(url, data) {
      // add code to store data
      returns object
    }
  }

You simply attach you cache object to the 'option.cache' property and pass it into 'elsewhere.graph' method.


### Custom Logger

Elsewhere use a simple logging system that write out to node console. You can replace the logger with your own functionally if you want store warnings and error into database or log file. To add you own custom logger all you need to do is provide an object contain the following interface:


  {
    function info(message) { // add code to pass on massage }
    function log (message) { // add code to pass on massage }
    function warn  (message) { // add code to pass on massage }
    function error (message) { // add code to pass on massage }
  }


You simply attach you logger object to the 'option.logger' property and pass it into 'elsewhere.graph' method.



[node]: http://nodejs.org/
[microformats]: http://microformats.org/wiki/rel-me
[_deferred]: https://npmjs.org/package/underscore.deferred