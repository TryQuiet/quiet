const path = require('path')
const nodeExternals = require('webpack-node-externals')
const WebpackBuildLinkedPackages = require('webpack-build-linked-packages')

module.exports = {
  mode: 'development',
  target: 'electron-main',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  plugins: [
    new WebpackBuildLinkedPackages({
      // Options go here
    })
  ],
  entry: ['@babel/polyfill', './src/main/main.js'],
  externals: [nodeExternals()],
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
        loader: 'node-loader'
      },
      {
        test: /\.worker\.(c|m)?js$/i,
        loader: 'worker-loader'
      },
      {
        test: /\.(t|j)sx?$/,
        loader: ['awesome-typescript-loader?module=es6'],
        exclude: [/node_modules/]
      }
    ]
  }
}
