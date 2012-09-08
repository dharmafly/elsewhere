---
category: reference
heading: Requiring Node Social Graph
---
At present Node Social Graph is not on NPM you you'll have to download it and unzip it into the `node_modules` directory of your node project yourself.

Once you have it installed you may require it and interact with it using the `graph` method.

    var Grapher = require('node-socialgraph');
    Grapher.graph('http://premasagar.com');
