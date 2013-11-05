---
category: overview
heading: Getting Started
path: overview
---

Elsewhere requires [Node.js][node] to be installed first.

Clone the repo and start the server by running these commands in the terminal:

    git clone git@github.com:dharmafly/elsewhere.git
    cd elsewhere
    npm install
    bin/elsewhere

Now head to [`localhost:8888`][localhost]. You can test the API on this page by entering a URL into the 'url' box and clicking 'Parse'. This will render the graph as a list on the page, complete with the names of each page of the graph and their respective favicons.

You can also test the API by simply appending the target URL to your address bar like so:

    http://localhost:8888/?url=chrisnewtn.com

This will return a JSON version of the graph e.g.

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
          verified: true,
          urlAliases: [
            "http://t.co/vV5BWNxil2"
          ]
        }
      ],
      warnings: [
        "http error: 404 (Not Found) - http://twitter.com/statuses/user_timeline/chrisnewtn.rss"
      ],
      query: "http://chrisnewtn.com",
      created: "2012-10-12T16:30:57.270Z",
      crawled: 9,
      verified: 9
    }

The initial crawl will take a while, as each page needs to be visited, checked and cached. Once cached though, it should be pretty snappy.




**[See the API Reference][reference]** for more details.

[node]: http://nodejs.org
[localhost]: http://localhost:8888
[reference]: reference/