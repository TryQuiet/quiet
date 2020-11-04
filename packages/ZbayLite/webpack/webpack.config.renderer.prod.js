const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        loader: ['awesome-typescript-loader?module=es6'],
        exclude: [/node_modules/]
      },
      {
        test: /\.js$/,
        loader: 'source-map-loader',
        enforce: 'pre'
      },
      {
        test: /\.css?$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.scss?$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.mp3$/,
        loader: 'file-loader'
      }
    ]
  },
  target: 'electron-renderer',
  entry: {
    index: './src/renderer/index.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Zbay',
      template: 'src/renderer/index.html'
    }),
    new WriteFilePlugin(),
    new webpack.EnvironmentPlugin({
      ZBAY_IS_TESTNET: 0
    })
  ],
  devtool: 'eval-source-map'
}
