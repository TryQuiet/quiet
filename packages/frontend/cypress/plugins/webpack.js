module.exports = {
    resolve: {
      extensions: [".ts", ".jsx", ".tsx", ".js"]
    },
    node: { fs: "empty", child_process: "empty", readline: "empty" },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /test/,
          use: [
            {
            loader: "ts-loader"
            }
          ]
        }
      ]
    }
  };