module.exports = {
  env: {
    test: {
      plugins: [
        "@babel/plugin-transform-modules-commonjs",
        "require-context-hook",
        "@babel/plugin-proposal-class-properties"
      ]
    }
  }
}