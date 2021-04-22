module.exports = {
  env: {
    "jest/globals": true
  },
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json'
  },
  parser: '@typescript-eslint/parser',
  plugins: ['react-hooks', 'jest'],
  rules: {
    'no-unused-vars': 'off',
    'no-void': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars-experimental': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
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
