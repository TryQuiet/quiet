class WebpackOnBuildPlugin {
  constructor(callback) {
    this.callback = callback
  }

  apply(compiler) {
    compiler.hooks.done.tap("WebpackOnBuildPlugin", this.callback);
  }
}

module.exports = WebpackOnBuildPlugin;
