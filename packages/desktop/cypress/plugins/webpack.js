const webpack = require('webpack'); //to access built-in plugins
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
    resolve: {
      extensions: [".ts", ".jsx", ".tsx", ".js"],
      fallback: {
        fs: false,
        child_process: false,
        readline: "empty",
        stream: false,
        zlib: false,
        path: false
      }
    },
    // node: { fs: "empty", child_process: "empty", readline: "empty" },
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