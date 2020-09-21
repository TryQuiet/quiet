const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const spawn = require('child_process').spawn
const WriteFilePlugin = require('write-file-webpack-plugin')
const WebpackOnBuildPlugin = require('on-build-webpack')

var mainRunning = false

module.exports = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css?$/,
        loaders: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.scss?$/,
        loaders: [ 'style-loader', 'css-loader' ]
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
    new webpack.HotModuleReplacementPlugin(),
    new WriteFilePlugin(),
    new WebpackOnBuildPlugin(() => {
      if (!mainRunning) {
        console.log('Starting main process...')
        mainRunning = true
        spawn('npm', ['run', 'start:main'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        }).on(
          'close', code => {
            mainRunning = false
            process.exit(code)
          }
        ).on(
          'error', spawnError => console.error(spawnError)
        )
      }
    })
  ],
  devServer: {
    hot: true
  },
  devtool: 'eval-source-map'
}
