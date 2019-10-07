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
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'fsMock.js')
    }
  }
}
