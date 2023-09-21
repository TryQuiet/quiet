const webpack = require('webpack')
const spawn = require('child_process').spawn
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackOnBuildPlugin = require('./webpack-on-build-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

var mainRunning = false

module.exports = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../dist/main'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: 'tsconfig.build.json' })
    ],
    conditionNames: ["import", "node"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader'
        },
        exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]state-manager/, /packages[\/\\]logger/]
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader'
        }
      },
      {
        test: /\.(mp3|ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: {
          loader: 'file-loader'
        }
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
    new WebpackOnBuildPlugin(async () => {
      if (!mainRunning) {
        console.log('Starting main process...')
        mainRunning = true
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
        spawn('npm', ['run', 'start:main'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        })
          .on('close', code => {
            mainRunning = false
            process.exit(code)
          })
          .on('error', spawnError => console.error(spawnError))
      }
    })
  ],
  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true
    }
  },
  devtool: 'eval-source-map'
}
