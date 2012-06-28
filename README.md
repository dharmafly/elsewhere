node-socialgraph
================

This project that aims to replicate the functionality of the Google Social Graph API. 

Simply, you provide it with a URL and the Grapher with crawl it for `rel=me` links; it then follows any links it find and crawls those too.

Once all crawled links have been followed the Grapher will return a _graph_ of what it found as a JSON array.

Usage
----------------

### Querying methods.

Start the server and provide the root URL with the domain and path that you wish to search for rel=me links. E.g.

    GET http://localhost:8888/premasagar.com

Using a query string your request should look like this.

    GET http://localhost:8888/?q=http%3A%2F%2Ftwitter.com%2Fpremasagar

### Strict Mode

Strict mode will only return pages that contain a link or links back to a valid page. 

A page is valid if it links back to another valid page, the URL you provide the graph to start with is valid; therefore any other page that links back to it becomes valid as well.

Requests made using the path method are made in strict mode, however when using the query string method it must be stated explicitly e.g.

    GET http://localhost:8888/?q=http%3A%2F%2Ftwitter.com%2Fpremasagar&strict

Requests made in non-strict mode will not check for links back to valid pages and instead return every page that was crawled.

### Response 

This will return a bit of JSON

    [
        {
            "url": "http://premasagar.com",
            "title": "Premasagar :: Home :: <remixing bits of stuff & things />",
            "favicon": "http://premasagar.com/favicon.ico"
        },
        {
            "url": "http://twitter.com/premasagar",
            "title": "Premasagar Rose (@premasagar) on Twitter",
            "favicon": "http://a0.twimg.com/a/1340420023/images/favicon.ico"
        },
        ...
    ]