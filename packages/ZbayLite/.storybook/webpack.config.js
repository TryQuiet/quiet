const path = require('path')

module.exports = {
  plugins: [],
  module: {
    rules: [
      {
        test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.scss|css$/,
        loader: 'style-loader!css-loader!sass-loader'
      }
    ]
  },
  node: {
    console: true,
    tls: 'empty'
  },
  resolve: {
    alias: {
      'electron-store-webpack-wrapper': path.resolve(__dirname, 'electronStoreMock.js'),
      net: path.resolve(__dirname, 'netMock.js'),
      fs: path.resolve(__dirname, 'fsMock.js')
    }
  }
}
