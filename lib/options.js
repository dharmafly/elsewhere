module.exports = {

  // Log progress to console.
  logging: true,

  // The maximum number of concurrent jsdom instances.
  jsdomInstanceLimit: 10,

  // The number of links crawled in a row without any
  // successful validations before the crawling of any 
  // subsequent links is abandoned.
  crawlLimit: 3
}