const path = require('path')

module.exports = {
  plugins: [],
  module: {
    rules: [
    ]
  },
  node: {
    console: true,
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'fsMock.js')
    }
  }
}
