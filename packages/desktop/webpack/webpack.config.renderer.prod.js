const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackOnBuildPlugin = require('on-build-webpack')
const webpack = require('webpack')
const spawn = require('child_process').spawn

module.exports = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist/main'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        loader: ['ts-loader'],
        exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]nectar/, /packages[\/\\]logger/]
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
    index: './src/renderer/index.tsx'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Quiet',
      template: 'src/renderer/index.html'
    }),
    new HtmlWebpackPlugin({
      title: 'Quiet-splash',
      template: 'src/renderer/splashScreen/splash.html',
      filename: 'splash.html'
    }),
    new webpack.EnvironmentPlugin({
      TEST_MODE: process.env.TEST_MODE
    }),
    new WebpackOnBuildPlugin(async () => {
      await new Promise((resolve, reject) => {
        spawn('npm', ['run', 'copyFonts'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => {
            resolve();
          })
          .on('error', spawnError => reject(spawnError))
      })
    })
  ],
  devtool: 'eval-source-map'
}
