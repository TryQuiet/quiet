module.exports = {
  env: {
    node: true
  },
  extends: [
    'standard',
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    '@typescript-eslint/space-before-function-paren': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off'
  }
}
