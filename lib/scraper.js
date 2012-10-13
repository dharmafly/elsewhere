var _             = require('underscore')._,
    request       = require('request'),
    cheerio       = require('cheerio'),
    urlParser     = require('url'),
    httpCodes     = require('./httpstatus.json'),
    fn            = require('./functions.js'),
    globalOptions = require('./options.js');



/**
 * Uses cheerio to scrape a page for 'rel=me' links, the title
 * of the page, and its favicon.
 */
function scrape (url, cache, logger, callback, options) {
  options = options || {};
  options.cache = options.cache || true;

  var data = {
    links:[],
    requestTime: 0
  }; 

  logger.info('parsing: ' + url)

  try{
    // get cached html or get html from page
    if (options.cache && cache.has(url)) {
      // from cache
      logger.log('fetched html from cache: ' + url); 
      parseHTML(cache.get(url), 0, callback);
    } else {
      if(url){
        var startedRequest = new Date();

        // from page
        request({uri: url}, function(requestErrors, response, body){
          if(!requestErrors && response.statusCode === 200){

            // add html into the cache
            if (options.cache) {
              cache.set(url, body) 
            };

            var endedRequest = new Date();
            var ms = endedRequest.getTime() - startedRequest.getTime();
            logger.log('fetched html from page: ' + ms + 'ms - ' + url);

            // is the content html
            if(response.headers['content-type'].indexOf('text/html') > -1){
              parseHTML(body, ms, callback);
            }else{
              parseOtherFormat(body, url, ms, callback);
            }

          }else{
            // add error information
            var err = requestErrors + ' - ' + url;
            if(response && response.statusCode){
              err = 'http error: '  + response.statusCode 
              + ' (' + httpCodes[response.statusCode] + ') - ' + url;
            }

            logger.warn(err)
            callback({'error': err}, data);
          }    
        });
      }else{
        // add error information
        logger.warn('no url given');
        callback({'error':'no url given'}, data);
      }
    }
  }
  catch(err)
  {
    logger.warn(err + ' - ' + url);
    callback({'error': err + ' - ' + url}, data);
  }


  // return a blank object for formats other than html
  function parseOtherFormat(content, url, requestTime, callback){
    var  url    = require('url').parse(url),
         icon   = url.protocol + "//" + url.host + "/favicon.ico";

    data = {
      links:[],
      requestTime: requestTime,
      title: url.href,
      favicon: icon
    }; 
    callback(null, data);
  }


  // parse the html for rel=me links
  function parseHTML(html, requestTime, callback){

    var startedDOMParse = new Date(),
        $ = cheerio.load(html);

    data.requestTime = requestTime;

    // get rel= me links from 'a' or 'link' tags
    $("a[rel~=me], link[rel~=me]").each(function (i, elem) {

      // issue 41 - https://github.com/dharmafly/elsewhere/issues/41
      // discount paging link with rel=me and either rel=next or rel=prev
      var rel = $(elem).attr('rel').toLowerCase();
      if(rel.indexOf('next') === -1 &&  rel.indexOf('prev') === -1){
        var href = $(elem).attr('href');
        // take a page URL, and a relative href and resolve it
        if (href.substring(0,1) === '/') {
          href = urlParser.resolve(url, href);
        }
        data.links.push(href);
        logger.log('found link: ' + href + ' in page: ' + url);
      }

    });

    logger.log('links found: ' + data.links.length + ' at: ' + url);

    // get the title, regex gets rid of new line characters etc.
    data.title = fn.trim($('title').text().replace(/(\r\n|\n|\r)/gm,""));

    // get the favicon
    data.favicon = resolveFavicon($, url);

    var endedDOMParse = new Date();
    var ms = endedDOMParse.getTime() - startedDOMParse.getTime();
    logger.log('time to parse DOM: ' + ms + 'ms - ' + url);

    callback(null, data);
  }

}


/**
 * Scrapes the favicon from the page if there is one,
 * if not then defaults to /favicon.ico. Should always
 * return a full URL.
 */
function resolveFavicon ($, url) {
  var favicon   = $('link[rel="shortcut icon"]'),
      url       = require('url').parse(url),
      rootUrl   = url.protocol + "//" + url.host,
      rtn;

  if (favicon.length > 0) {
    favicon = $(favicon).attr('href');

    if (favicon.substring(0,2) === "//") {
      rtn = url.protocol + favicon;
    } else if (favicon.substring(0,1) === "/") {
      rtn = rootUrl + favicon;
    } else {
      rtn = favicon;
    }

  } else {
    rtn = rootUrl + "/favicon.ico";
  }

  return rtn;
}



exports.scrape = scrape;