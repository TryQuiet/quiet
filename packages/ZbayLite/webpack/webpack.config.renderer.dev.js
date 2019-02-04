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
      }
    ]
  },
  target: 'electron-renderer',
  entry: {
    index: './src/index.js'
  },
  plugins: [
    new HtmlWebpackPlugin(),
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
  }
}
