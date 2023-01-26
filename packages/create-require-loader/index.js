const { promisify } = require('util')


module.exports = async function createRequireLoader(content, map, meta) {
  const callback = this.async();
  const updatedContent = content.replace(
    "const pkg = req('../../package.json')",
    "import pkg from '../../package.json'"
  )
  callback(null, updatedContent);
}
