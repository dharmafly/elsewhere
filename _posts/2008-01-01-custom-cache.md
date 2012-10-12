--- 
heading: Custom Cache
category: reference
---

Elsewhere use an in-memory cache to store the html of web pages. The options object contains a property called 'cacheTimeLimit' which can be use to set the refresh gap, by default it is set 360000ms. The number of items stored in the cache can be limited using the options property 'cacheItemLimit' by default its is set to a 1000 items.

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
