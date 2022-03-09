const webpack = require('webpack'); //to access built-in plugins
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
    resolve: {
      extensions: [".ts", ".jsx", ".tsx", ".js"]
    },
    node: { fs: "empty", child_process: "empty", readline: "empty" },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
            exclude: [/node_modules/],
            loader: "ts-loader",
          },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        {
          test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9=&.]+)?$/,
          loader: 'file-loader'
        },
      ]
    }
  };