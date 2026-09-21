const { jest: baseConfig } = require('./package.json')

module.exports = {
  ...baseConfig,
  displayName: 'live-qss-integration',
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  testRegex: ['[\\\\/]manual-tests[\\\\/]qss[\\\\/]qss\\.module\\.integration\\.spec\\.ts$'],
}
