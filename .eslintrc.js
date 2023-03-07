module.exports = {
  env: {
    "jest/globals": true
  },
  root: true,
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json'
  },
  parser: '@typescript-eslint/parser',
  plugins: ['react-hooks', 'jest'],
  rules: {
    'node/no-path-concat': 'off',
    'multiline-ternary': 'off',
    'no-eval': 'off',
    'no-void': 'off',
    'no-unused-vars': 'off',
    'array-callback-return': 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars-experimental': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    "@typescript-eslint/prefer-ts-expect-error": "off",
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/default-param-last': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/dot-notation': 'off',
    'generator-star-spacing': ['error', { before: false, after: true }],
    'yield-star-spacing': ['error', { before: false, after: true }],
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'no-case-declarations': 'off',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: false
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ]
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-unused-vars-experimental': 'off',
        'no-redeclare': 'off'
      }
    },
    {
      files: ['*.test.tsx'],
      rules: {
        'no-irregular-whitespace': 'off'
      }
    },
    {
      "files": [
        '*.test.js',
        '*.test.ts'
      ],
      "env": {
        "jest": true
      }
    }
  ]
}
