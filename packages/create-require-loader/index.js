const path = require('path')

module.exports = async function createRequireLoader(content, map, meta) {
  const callback = this.async();

  let updatedContent
  if (content.includes("const pkg = req('../../package.json')")) {
    updatedContent = content.replace(
      "const pkg = req('../../package.json')",
      "import pkg from '../../package.json'"
    )
  } else {
    updatedContent = content.replace(
      "const binding = require('./binding')",
      "const binding = require('./binding').default"
    )
  }

  console.log('updated content', updatedContent)

  callback(null, updatedContent);
}
