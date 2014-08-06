---
category: reference
heading: Global configuration
path: reference
---

Instead of using a local options object each time you call the `graph()` method, you can also set global options by setting properties in the `elsewhere.options` object.

Global options act as default values, which can then be overriden by options passed when calling the `graph()` method.

**strict** (boolean)  Whether the crawler allows only reciprocal `rel="me"` links or not. A reciprocal link is where the page at a URL links to another page in the graph, and a page in the graph links back to the original URL. When `true`, there will be no false positives, but fewer results. Default: `false`

**logLevel** (integer) There are 4 levels of logging in Elsewhere: 4 - log, 3 - info, 2 - warn and 1 -  error. The 4 setting gives the most granular logs, which are useful in a debugging scenario. Default: `3` 

**crawlLimit** (integer) The number of links that Elsewhere will follow without a successful verification before it abandons the chain. Default: `3`

**domainLimit** (integer) The number of links crawled within a particular domain before the crawling of subsequent links in the domain is abandoned. Default: `3`

**stripDeeperLinks** (boolean) If set to `true` then Elsewhere will remove links from the graph if they are at a deeper path than other links in the same domain. For example, `plus.google.com/{id}` is retained, but `plus.google.com/{id}/posts` is discarded. This is useful, for example, to strip out paginated contacts pages on social networks. Default: `true`

**useCache** Whether a request should use the cache during a request. Default: `true` 

**cacheTimeLimit** The amount of time, in milliseconds, that graphs and pages are kept in the cache before they are discarded. Default: `3600000`

**cacheItemLimit** (integer) The maximum number of items that can be kept in the cache before the oldest items are discarded. Use to limit memory. Default: `1000`

**httpHeaders** (object) An object the HTTP header properties use when requesting resources from the internet.

For example:
    
    elsewhere.options.strict = false;

If you are running Elsewhere as a server, then you may set the options directly in `lib/options.js`. 
