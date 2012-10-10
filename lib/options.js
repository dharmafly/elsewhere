module.exports = {

  // The level at which to log
  //  error  1
  //  warn   2
  //  info   3
  //  log    4
  logLevel: 3,

  // Weather the spider only allows reciprocal rel="me" links
  // true will give you less results, but with less of a chance of error
  strict: false,

  // The number of links crawled in a row without any
  // successful validations before the crawling of any
  // subsequent links is abandoned.
  crawlLimit: 3,

  // issue 40 - https://github.com/dharmafly/elsewhere/issues/40
  // The number of links crawled within one domain before 
  // the crawling of any subsequent links is abandoned.
  domainLimit: 3,

  // If set to true then links at deeper path depths than
  // that of the shallowest on the same domain will be
  // discarded.
  stripDeeperLinks: true,

  // The amount of time graphs and links are kept in the
  // cache for before they are discarded. Time in 
  // milliseconds.
  cacheTimeLimit: 3600000,  // 3600000 = 1hr

  // The number of items to keep in cache before
  // some are discarded. Use to limit memory use
  cacheItemLimit: 1000

}