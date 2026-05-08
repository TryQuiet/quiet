/**
 * Jest config for the QSS stress harness.
 *
 * Inherits the package's default ts-jest ESM setup but disables type
 * diagnostics. The worktree symlinks 3rd-party submodules from the main
 * checkout, which makes ts-jest see two distinct TS module identities for
 * the same physical file. Runtime resolution (Node's symlink-collapsing)
 * still works correctly; we just need to bypass the static type check.
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  clearMocks: true,
  coverageProvider: 'v8',
  transformIgnorePatterns: ['node_modules/(?!p-defer|peer-id)'],
  testTimeout: 240_000,
  setupFiles: ['./jestSetup.ts'],
  testEnvironment: 'jest-environment-node',
  testRegex: ['[\\\\/]src[\\\\/]nest[\\\\/]qss[\\\\/]stress[\\\\/].*\\.stress\\.spec\\.ts$'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: false,
      },
    ],
  },
}
