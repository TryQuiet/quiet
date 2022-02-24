module.exports = {
    resolve: {
      extensions: [".ts", ".jsx"]
    },
    node: { fs: "empty", child_process: "empty", readline: "empty" },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          use: [
            {
            loader: "ts-loader"
            }
          ]
        }
      ]
    }
  };