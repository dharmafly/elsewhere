Elsewhere
=========

[Elsewhere][elsewhere] is a [Node.js][node] project that aims to replicate part of the functionality of the Google's now discontinued [Social Graph API][google-social-graph-api]. When given the URL of a person's website or social media profile (e.g. a [Twitter account][twitter-profile]), and it outputs a JSON-formatted list of the other websites and social media profiles that belong to that person. In other words, it can determine a person's ['social graph'][socialgraph] from a single URL in the graph.

Elsewhere can be set up as a web service, providing a JSON API that can be easily queried over a network. It can also be included as a Node module and used directly within a server-side project.


## How does it work?

Elsewhere crawls the web page at the supplied URL and looks for links that contain the attribute [`rel=me`][rel=me]:

    <a href="http://dharmafly.com" rel="me">Dharmafly</a>

The `rel=me` attribute is a microformat to assert that the link is to a website, page or resource that is owned by (or is about) the same person that at the target URL. For example, if the target URL is a person's Twitter profile page, then that page may contain a link to the person's home page or main website.

The URLs in the `rel=me` links are then crawled for further `rel=me` links and so on, building a comprehensive graph along the way.

For example, a person's Twitter profile page may link to his or her home page, which then links to the person's Last.fm, Flickr, Facebook, GitHub, LinkedIn and Google+ profiles, as well as the person's company website. The information in the graph is all public, having been added by the person when they created their social media profiles and web pages.

Once Elsewhere has run out of `rel=me` links to crawl, it returns the list of URLs it has found, representing the person's 'social graph'.


## Strict Mode and verified links

Elsewhere can make strict checks to verify that that each linked URL is indeed owned by the same person as the original site. After all, anyone could create a website, add a `rel=me` link to [Elvis Presley][elvis]'s website and claim to be him.

Elsewhere checks if the linked page itself has a `rel=me` link back to the original URL. If there is such a reciprocal link, then the relationship is deemed to be 'verified'.

But Elsewhere is more sophisticated than that. The reciprocal link doesn't have to be directly between the two sites. For example, if a Twitter account links to a GitHub account, which links to a home page, which links back to the Twitter account, then the relationship between the Twitter account and home page will be verified, even though the two don't directly link to each other.

Elsewhere operates in non-strict mode by default, in which it will return both verified and unverified URLs. This mode is useful because many profile pages and personal websites lack `rel=me` links, making it difficult to verify those links and leading to many legitimate links being missed.

To be absolutely sure of the stated relationships, turn on strict mode (by setting the `strict` option to `true`) and only verified URLs will be returned.


## Getting started

Elsewhere requires Node.js to be installed first.

Clone the repo and start the server by running these commands in the terminal:

    git clone git@github.com:dharmafly/elsewhere.git
    cd elsewhere
    npm install
    bin/elsewhere

Now head to [`localhost:8888`][localhost], type in a URL and hit enter. Alternatively, supply the target URL as a query parameter:

    http://localhost:8888/?url=chrisnewtn.com

The JSON returned looks like this:

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


## Using Elsewhere as a Node Module
 
Elsewhere is available on [NPM][npm]. To install it, run:

    npm install elsewhere

Once you have it installed, you can [require()][require] it and interact with it using the `graph()` method.

    var elsewhere = require('elsewhere');

    elsewhere.graph('http://premasagar.com').then(function (graph) {
        res.end(graph.toJSON());
    });


## elsewherejs.com

**[See elsewherejs.com][elsewhere] for full documentation.**


[elsewhere]: http://elsewherejs.com
[node]: http://nodejs.org
[rel=me]: http://microformats.org/wiki/rel-me
[_deferred]: https://npmjs.org/package/underscore.deferred
[npm]: https://npmjs.org/package/elsewhere
[require]: http://nodejs.org/api/globals.html#globals_require