const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackOnBuildPlugin = require('./webpack-on-build-plugin')
const webpack = require('webpack')
const spawn = require('child_process').spawn
const dotenvx = require('@dotenvx/dotenvx')
const result = dotenvx.config({ path: process.env.ENVFILE || '.env.production' })
const envKeys = result.parsed ? Object.keys(result.parsed) : []

module.exports = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist/main'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
        },
        exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]state-manager/, /packages[\/\\]logger/],
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader',
        },
      },
      {
        test: /\.(mp3|ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: {
          loader: 'file-loader',
        },
      },
    ],
  },
  target: 'electron-renderer',
  entry: {
    index: './src/renderer/index.tsx',
  },
  plugins: [
    new webpack.EnvironmentPlugin(envKeys),
    new HtmlWebpackPlugin({
      title: 'Quiet',
      template: 'src/renderer/index.html',
    }),
    new HtmlWebpackPlugin({
      title: 'Quiet-splash',
      template: 'src/renderer/splashScreen/splash.html',
      filename: 'splash.html',
    }),
    new WebpackOnBuildPlugin(async () => {
      await new Promise((resolve, reject) => {
        spawn('npm', ['run', 'copyFonts'], {
          shell: true,
          env: process.env,
          stdio: 'inherit',
        })
          .on('close', code => {
            resolve()
          })
          .on('error', spawnError => reject(spawnError))
      })
      await new Promise((resolve, reject) => {
        spawn('npm', ['run', 'setMainEnvs'], {
          shell: true,
          env: process.env,
          stdio: 'inherit',
        })
          .on('close', code => {
            resolve()
          })
          .on('error', spawnError => reject(spawnError))
      })
    }),
  ],
  devtool: 'eval-source-map',
}
