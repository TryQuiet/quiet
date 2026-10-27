// Test helper (not a build hook): runs a function in a clean build environment, as a CI or local build would see it.
const signing = require('./updateSigning.cjs')

// CI and event labels, cleared so a test sees only what it sets; none of them may change the outcome.
const CLEAN_ENV = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'GITHUB_ACTIONS',
  'GITHUB_EVENT_NAME',
  'GITHUB_BASE_REF',
  'GITHUB_REF',
  'GITHUB_REF_TYPE',
  'CI_COMMIT_TAG',
  'IS_LOCAL',
  'IS_E2E',
  'E2E',
  'PUBLISH_FOR_PULL_REQUEST',
  'npm_lifecycle_event',
  signing.KEY_ENV,
  signing.REQUIRE_ENV,
]
// Runs `fn` with a clean build environment plus `env`.
const inBuild = async (env, fn) => {
  const saved = { ...process.env }
  for (const name of CLEAN_ENV) delete process.env[name]
  Object.assign(process.env, env)
  try {
    return await fn()
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name]
    Object.assign(process.env, saved)
  }
}

module.exports = { inBuild }
