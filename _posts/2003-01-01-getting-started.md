--- 
category: overview
heading: Getting started
---

Elsewhere requires [Node.js][node] to be installed first.

Download Elsewhere and start the server by running these commands in the terminal:

    git clone git@github.com:dharmafly/elsewhere.git
    cd elsewhere
    npm install
    bin/elsewhere

Now just head to [`localhost:8888`][localhost], type in a URL and hit enter. The initial crawl will take a while, as each page needs to be visited, checked and cached. Once cached though, it should be pretty snappy.

[node]: http://nodejs.org
[localhost]: http://localhost:8888