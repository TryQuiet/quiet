const path = require('path')

// Keep Detox's lifecycle and reuse the desktop suite's existing TS selectors.
// Both apps run on the same host; there is no remote desktop controller.
module.exports = {
  ...require('./jest.config'),
  testMatch: ['<rootDir>/e2e/desktop.qss.test.js'],
  transform: {
    '^.+\\.tsx?$': [
      require.resolve('ts-jest', { paths: [path.resolve(__dirname, '../../e2e-tests')] }),
      {
        tsconfig: {
          target: 'ES2020',
          module: 'CommonJS',
          esModuleInterop: true,
          strict: true,
          useUnknownInCatchVariables: false, // Matches packages/e2e-tests/tsconfig.json.
        },
      },
    ],
    '^.+\\.jsx?$': require.resolve('babel-jest'),
  },
  testTimeout: 240000,
}
