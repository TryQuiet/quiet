import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

/**
 * Every end-to-end suite is either scheduled by a workflow or declared manual here, with a reason.
 *
 * Suites are expensive and slow, so it is tempting to write one and wire it up "later". Later does
 * not come: this repo carried three DM suites — around 1,600 lines — that no workflow ran, and
 * nothing anywhere said whether that was deliberate. A suite nobody runs is worse than no suite,
 * because it reads like coverage.
 *
 * Adding a suite therefore forces a decision. Schedule it, or name it below and say why.
 */
const manualSuites = {
  'multipleClients.secureDms.crossPlatform.test.ts':
    'Drives Electron and a real Android build together, gated on QUIET_DM_ANDROID_DEVICE (the suite ' +
    'is describe.skip without it). CI has no runner with an emulator and a desktop app side by side.',
  'secure-dms.test.js':
    'The Android half of multipleClients.secureDms.crossPlatform; detox spawns it, so it is never ' +
    'invoked on its own.',
  'profile-photo.test.js':
    'Needs a device with a fixture seeded into the app cache and the picker hook build, so it is ' +
    'opt-in behind QUIET_E2E_PROFILE_PHOTO: `npx detox test -c android.att.e2e e2e/profile-photo.test.js`.',
  'multipleClients.dms.test.ts':
    'UNSCHEDULED, AND THAT IS THE BUG THIS FILE EXISTS TO SURFACE. ~1,600 lines of DM coverage no ' +
    'workflow runs. It should go into e2e-linux; it is listed here only because it has not yet had ' +
    'a verified green run on an uncontended machine, and wiring an unverified suite into CI trades ' +
    'one silent problem for a noisy one. Remove this entry once it passes.',
  'multipleClients.dms.qss.test.ts':
    'Same as multipleClients.dms.test.ts, for the QSS topology — belongs in e2e-qss-linux once the ' +
    'non-QSS one is proven.',
  'qss.onboarding.test.js':
    'Needs the android.e2e.qss app variant and a reachable QSS server, and compares screenshots ' +
    'against committed baselines. No workflow builds that variant or refreshes the baselines.',
  'storybook.test.js':
    'Drives the separate android.storybook APK and diffs every story against committed baseline ' +
    'screenshots. No workflow builds that APK.',
}

const workflowsDirectory = new URL('../.github/workflows/', import.meta.url)
const suiteDirectories = [
  { url: new URL('../packages/e2e-tests/src/tests/', import.meta.url), pattern: /\.test\.ts$/ },
  { url: new URL('../packages/mobile/e2e/', import.meta.url), pattern: /\.test\.js$/ },
]

const readSuites = async () => {
  const suites = []
  for (const { url, pattern } of suiteDirectories) {
    const entries = await readdir(url, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && pattern.test(entry.name)) suites.push(entry.name)
    }
  }
  return suites.sort()
}

/** A suite is scheduled if a workflow names the file, or — as detox is invoked — its base name. */
const isScheduled = (suite, workflows) => {
  if (workflows.includes(suite)) return true
  const base = suite.replace(/\.test\.(ts|js)$/, '')
  return new RegExp(`detox test\\s+${base}\\b`).test(workflows)
}

const readWorkflowSource = async () => {
  const files = (await readdir(workflowsDirectory)).filter(file => /\.ya?ml$/.test(file))
  const sources = await Promise.all(files.map(file => readFile(new URL(file, workflowsDirectory), 'utf8')))
  return sources.join('\n')
}

test('every e2e suite is either scheduled by a workflow or declared manual', async () => {
  const suites = await readSuites()
  const workflows = await readWorkflowSource()

  assert.ok(suites.length > 0, 'expected to find e2e suites')

  const unscheduled = suites.filter(suite => !isScheduled(suite, workflows) && !(suite in manualSuites))
  assert.deepEqual(
    unscheduled,
    [],
    `No workflow runs these suites. Add them to a workflow, or list them in manualSuites with the ` +
      `reason they cannot run in CI:\n  ${unscheduled.join('\n  ')}`
  )
})

test('every manual declaration still matches a suite that no workflow runs', async () => {
  const suites = new Set(await readSuites())
  const workflows = await readWorkflowSource()

  for (const [suite, reason] of Object.entries(manualSuites)) {
    assert.ok(suites.has(suite), `manualSuites names ${suite}, which no longer exists — drop the entry`)
    assert.ok(reason.length > 40, `manualSuites entry for ${suite} needs a reason someone can act on`)
    assert.ok(
      !isScheduled(suite, workflows),
      `${suite} is scheduled by a workflow now — remove it from manualSuites so the list stays honest`
    )
  }
})
