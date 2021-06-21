module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'standard'
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
  }
}
