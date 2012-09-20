---
category: reference
heading: Global Configuration
---
Instead of using a local `options` object each time you call the graph method, you can also set options in the global options object.

Options shared between the global options object and local objects that are set via the global object act as defaults for each call to the graph method, any options that are then provided directly to the graph method via a local object will override those of the global object.

The two options shared between the global options object and local objects are `crawlLimit` and `stripDeeperLinks`.

 - logging (boolean) If set to `true` then Elsewhere will output the progress of the graph construction out to the terminal.

 - jsdomInstanceLimit (integer) The maximum allowed number of concurrent JSDom instances. Set too low and graphs to be constructed too slowly, too high and you'll run out of memory. Defaults to 10.

 - crawlLimit (integer) The number of links Elsewhere will follow without a successful verification before it abandons the chain. Defaults to 3.

 - stripDeeperLinks (boolean) If set to `true` then Elsewhere will discard links that share a domain with another link or links at a shallower level. E.g. plus.google.com/{id} is kept, while plus.google.com/{id}/posts is discarded.

 - cacheLimit (integer) The maximum amount of time (in milliseconds) that the constituent links of a graph are kept in memory for. If you are running the Elsewhere server then this figure also goes for complete graphs as well.

If you are running Elsewhere as a server then you may set these options directly in `lib/options.js`. Here is some example usage of the options object:

    elsewhere.options.jsdomInstanceLimit = 20;
    
    elsewhere.options.logging = false;

