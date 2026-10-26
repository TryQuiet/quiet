// Test helper: runs a function in a clean build environment, like a given electron-builder invocation.
const signing = require('./updateSigning.cjs')

const CLEAN_ENV = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'BUILD_NUMBER',
  'RUN_ID',
  'GITHUB_ACTIONS',
  'GITHUB_EVENT_NAME',
  'GITHUB_BASE_REF',
  'TRAVIS_PULL_REQUEST',
  'IS_LOCAL',
  'IS_E2E',
  'E2E',
  'PUBLISH_FOR_PULL_REQUEST',
  'npm_lifecycle_event',
  'TRAVIS_TAG',
  'APPVEYOR_REPO_TAG_NAME',
  'CIRCLE_TAG',
  'BITRISE_GIT_TAG',
  'CI_BUILD_TAG',
  'CI_COMMIT_TAG',
  'BITBUCKET_TAG',
  'GITHUB_REF',
  'GITHUB_REF_TYPE',
  signing.KEY_ENV,
]
// Runs `fn` with a clean build environment (plus `env`) and the given command line.
const inBuild = async (env, argv, fn) => {
  const saved = { ...process.env }
  const savedArgv = process.argv
  for (const name of CLEAN_ENV) delete process.env[name]
  Object.assign(process.env, env)
  process.argv = [savedArgv[0], 'electron-builder', ...argv]
  try {
    return await fn()
  } finally {
    process.argv = savedArgv
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name]
    Object.assign(process.env, saved)
  }
}

module.exports = { inBuild }
