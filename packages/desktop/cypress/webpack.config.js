const webpack = require('webpack'); //to access built-in plugins
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    resolve: {
      extensions: [".ts", ".jsx", ".tsx", ".js"],
      alias: {
        // Force Webpack to ignore the electron module completely\
        // needed in electron 32+, since you can no longer access the path of a File, and
        // instead need to use the nodejs backed webUtils.getPathForFile (from electron) in the renderer
        electron: false
      },
      fallback: {
        fs: false,
        path: false,
        child_process: false
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      }),
      new NodePolyfillPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader'
          },
          exclude: [/node_modules/]
          },
        {
          test: /\.css$/,
          use: {
            loader: 'css-loader'
          }
        },
        {
          test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          use: {
            loader: 'file-loader'
          }
          
        },
      ]
    }
  };
