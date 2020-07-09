const loaderUtils = require('loader-utils')
const path = require('path')

module.exports = function (content) {
  const loaderOptions = loaderUtils.getOptions(this) || {}

  const from = loaderOptions.from || '.'
  const name = loaderUtils.interpolateName(
    this,
    loaderOptions.name || '[name].[ext]',
    {
      content,
      context:
        loaderOptions.context ||
        this.rootContext ||
        (this.config && this.config.context)
    }
  )

  let requirePath
  if (process.env.NODE_ENV === 'production') {
    requirePath = path.posix.relative(from, name)
    if (requirePath[0] !== '.') {
      requirePath = './dist/' + requirePath
    }
  } else {
    requirePath = '../native/index.node'
  }

  if (typeof this.emitFile === 'function') {
    this.emitFile(name, content, false)
    this.addDependency(this.resourcePath)
  } else {
    throw new Error('emitFile function is not available')
  }
  return `module.exports = __non_webpack_require__(${loaderUtils.stringifyRequest(
    this,
    requirePath
  )});`
}

module.exports.raw = true
