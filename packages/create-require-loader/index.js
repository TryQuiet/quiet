const path = require('path')

module.exports = async function createRequireLoader(content, map, meta) {
  const callback = this.async();

  let updatedContent
  if (content.includes("const pkg = req('../../package.json')")) {
    if (process.platform === 'win32') return
    updatedContent = content.replace(
      "const pkg = req('../../package.json')",
      `import pkg from '${path.join("..", "..", "package.json")}'`
    )
  } else {
    updatedContent = content.replace(
      "const binding = require('./binding')",
      "const binding = require('./binding').default"
    )
  }

  callback(null, updatedContent);
}
