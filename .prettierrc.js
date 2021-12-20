const prettierConfigStandard = require('prettier-config-standard')
const modifiedConfig = {
  ...prettierConfigStandard,
  singleQuote: true,
  jsxSingleQuote: true,
  spaceBeforeFunctionParen: true,
  printWidth: 100,
  parser: 'typescript'
  // ... other modified settings here
}

module.exports = modifiedConfig
