// const prettierConfigStandard = require('prettier-config-standard')

// {
//   "arrowParens": "always",
//   "bracketSpacing": true,
//   "jsxBracketSameLine": false,
//   "jsxSingleQuote": false,
//   "quoteProps": "as-needed",
//   "singleQuote": true,
//   "semi": false,
//   "printWidth": 140,
//   "useTabs": false,
//   "tabWidth": 2,
//   "trailingComma": "es5"
// }

const modifiedConfig = {
  // ...prettierConfigStandard,
  singleQuote: true,
  jsxSingleQuote: true,
  spaceBeforeFunctionParen: true,
  printWidth: 100,
  parser: 'typescript'
  // ... other modified settings here
}

module.exports = modifiedConfig
