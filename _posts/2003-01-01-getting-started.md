--- 
heading: Getting started
category: overview
---

Elsewhere requires [Node.js][node] to be installed first.

Clone the repo and start the server by running these commands in the terminal:

    git clone git@github.com:dharmafly/elsewhere.git
    cd elsewhere
    npm install
    bin/elsewhere

Now head to [`localhost:8888`][localhost], type in a URL and hit enter. Alternatively, supply the target URL as a query parameter:

    http://localhost:8888/?url=chrisnewtn.com

The returned JSON looks like this:

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
      created: "2012-10-12T16:30:57.270Z",
      crawled: 9,
      verified: 9
    }

The initial crawl will take a while, as each page needs to be visited, checked and cached. Once cached though, it should be pretty snappy.

**[See the API Reference][reference]** for more details.

[node]: http://nodejs.org
[localhost]: http://localhost:8888
[reference]: reference/