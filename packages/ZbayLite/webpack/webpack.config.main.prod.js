const path = require('path')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  target: 'electron-main',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
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
        test: /\.worker\.?js$/,
        loader: 'worker-loader'
      },
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
        test: /\.(t|j)sx?$/,
        loader: ['awesome-typescript-loader?module=es6'],
        exclude: [/node_modules/]
      },
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      ZBAY_IS_TESTNET: 0
    })
  ]
}
