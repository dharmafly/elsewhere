--- 
heading: Querying the Elsewhere server
category: overview
---

The Elsewhere server accepts the following parameters:

  * **url** (string) This parameter represents the entry point into the graph, you can include `http` or omit it. The string should be URL encoded.
  * **strict** (boolean) [optional] Set to `true` if you want to omit unverified links. If you omit this parameter it will default to `false`.

Here are some example requests:
    
    GET http://localhost:8888/?url=chrisnewtn.com
    GET http://localhost:8888/?url=premasagar.com&strict=true

All responses are encoded as UTF-8 JSON.