--- 
heading: Custom cache
category: reference
---

Elsewhere use an in-memory cache to store the HTML of web pages.

The options object contains a property called `cacheTimeLimit` that can be used to set the cache refresh time. By default, this is 3600000ms (1 hour). The number of items stored in the cache can be limited using the options property `cacheItemLimit`. By default, the cache is limited to 1000 items.

You can replace the cache with your own, for example, to store the cached date in a database or file system. To add you own custom cache, all you need to do is provide an object containing the following interface:

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

and then add this interface as the `cache` property of the options object passed into the `graph()` method.
