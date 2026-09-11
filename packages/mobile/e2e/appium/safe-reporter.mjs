// Publish locations and fixed error categories, never test names, messages,
// assertion values, capabilities or raw stacks: all can contain invitations.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const files = [
  'packages/mobile/e2e/appium/config.mjs',
  'packages/mobile/e2e/appium/desktop.mjs',
  'packages/mobile/e2e/appium/mobile.mjs',
  'packages/mobile/e2e/appium/scenarios.mjs',
  'packages/mobile/e2e/appium/onboarding.test.mjs',
  'packages/mobile/e2e/appium/full-loop.test.mjs',
  'packages/mobile/e2e/appium/test/fixtures/reporter-failures.mjs',
  'packages/mobile/e2e/utils/qssCommunity.cjs',
  'packages/mobile/e2e/utils/qssOnlyBuild.cjs',
  'packages/mobile/e2e/utils/desktopProcesses.cjs',
  'packages/e2e-tests/src/selectors.ts',
  'packages/e2e-tests/src/utils.ts',
]
const codes = new Set(['ERR_TEST_FAILURE', 'ERR_ASSERTION', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOENT', 'EACCES'])
const types = new Set(['testCodeFailure', 'hookFailed', 'subtestsFailed', 'testTimeoutFailure', 'cancelledByParent'])
const classes = new Set(['Error', 'AssertionError', 'TypeError', 'RangeError', 'SyntaxError', 'TimeoutError'])
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = files.map(file => [file, new RegExp(escape(path.join(root, file)) + ':(\\d+):(\\d+)(?=[)\\s]|$)', 'g')])

function failure(data) {
  const errorCodes = new Set()
  const errorTypes = new Set()
  const errorClasses = new Set()
  const locations = new Map()
  let error = data.details?.error
  for (let depth = 0; error && depth < 5; depth++, error = error.cause) {
    if (codes.has(error.code)) errorCodes.add(error.code)
    if (types.has(error.failureType)) errorTypes.add(error.failureType)
    if (classes.has(error.name)) errorClasses.add(error.name)
    if (typeof error.stack !== 'string') continue
    for (const line of error.stack.split('\n').slice(1, 100)) {
      // Only stack frames count. A multi-line exception message must not add
      // arbitrary diagnostics, even if it includes something resembling a path.
      if (!/^\s+at /.test(line)) continue
      for (const [file, pattern] of patterns) {
        for (const match of line.matchAll(pattern)) {
          const location = { file, line: Number(match[1]), column: Number(match[2]) }
          if (Number.isSafeInteger(location.line) && Number.isSafeInteger(location.column)) {
            locations.set(JSON.stringify(location), location)
          }
        }
      }
    }
  }
  return { event: 'test-failure', errorCodes: [...errorCodes], errorTypes: [...errorTypes],
    errorClasses: [...errorClasses], locations: [...locations.values()].slice(0, 20) }
}

export default async function* reporter(source) {
  let failedEvents = 0
  let passedEvents = 0
  for await (const event of source) {
    if (event.type === 'test:fail') {
      failedEvents++
      yield JSON.stringify(failure(event.data)) + '\n'
    }
    if (event.type === 'test:pass') passedEvents++
  }
  // Node 20 does not emit test:summary. Count reporter events (including parent
  // tests) explicitly; the separate CI receipt checks the actual process exit.
  yield JSON.stringify({ event: 'report-complete', failedEvents, passedEvents }) + '\n'
}
