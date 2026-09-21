'use strict'
// Keep resolving the original dependency from its importing package. Wrapping
// that resolved module avoids requiring a second/hoisted sodium installation.
module.exports = function (source) {
  const adapter = require.resolve('./sodium-native.cjs')
  return source + '\nmodule.exports = require(' + JSON.stringify(adapter) + ').enable(module.exports);\n'
}
