---
category: overview
heading: Getting Started
---
Elsewhere requires [Node.js][node] that you will need to have installed before you can follow the instructions below. 

To download Elsewhere and start the server, you just need run these commands in your terminal application.

    git clone git@github.com:dharmafly/elsewhere.git
    cd elsewhere
    npm install
    bin/elsewhere

Now just head to `localhost:8888`, type in a url and hit enter. The initial crawl will take while as each page needs to be visited and cached. Once cached though, you should find it pretty snappy.

[node]: http://nodejs.org/