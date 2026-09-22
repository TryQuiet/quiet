exports.default = async function beforeBuild() {
  // msgpackr-extract's Node-API mode is also used for its upstream portable
  // prebuilds. Keep native acceleration without compiling against Electron's
  // private V8 API (whose headers are not supported by every host compiler).
  process.env.ENABLE_V8_FUNCTIONS = 'false'
  return true // Continue electron-builder's native dependency rebuild.
}
