module.exports = {

  // Log progress to console.
  logging: true,

  // The maximum number of concurrent jsdom instances.
  jsdomInstanceLimit: 10,

  // The number of links crawled in a row without any
  // successful validations before the crawling of any
  // subsequent links is abandoned.
  crawlLimit: 3,

  // If set to true then links at deeper path depths than
  // that of the shallowest on the same domain will be
  // discarded.
  stripDeeperLinks: true,

  // The amount of time graphs and links are kept in the
  // cache for before they are discarded. Time in 
  // milliseconds.
  cacheLimit: 3600000
}