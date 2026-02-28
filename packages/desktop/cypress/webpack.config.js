const webpack = require('webpack'); //to access built-in plugins
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    resolve: {
      extensions: [".ts", ".jsx", ".tsx", ".js"],
      fallback: {
        fs: false
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