const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be within the project folder
  // so that the downloaded Chrome browser is included in the build artifact.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
