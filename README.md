node-socialgraph
================

A node project that aims to replicate the functionality of the Google Social Graph API

Usage
----------------

Start the server and provide the root url with that domain and path that you wish to search for rel=me links. E.g.

	http://localhost:8888/premasagar.com

This will return a bit of json

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