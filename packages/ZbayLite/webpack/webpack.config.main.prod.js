const path = require('path')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  target: 'electron-main',
  entry: [
    '@babel/polyfill',
    './src/main/main.js'
  ],
  externals: [
    nodeExternals()
  ],
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js'
  },
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.node$/,
        use: [
          {
            loader: path.resolve('./webpack/loaders/NativeLoader.js'),
            options: {
              name: '[name]-[hash].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      ZBAY_IS_TESTNET: 0
    })
  ]
}
