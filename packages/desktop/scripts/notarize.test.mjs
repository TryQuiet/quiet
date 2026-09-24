import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import test from 'node:test'

const packageDir = fileURLToPath(new URL('../', import.meta.url))
const script = await readFile(new URL('./notarize.js', import.meta.url), 'utf8')
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

function loadNotarizationHook(env, notarize) {
  const exports = {}
  vm.runInNewContext(script, {
    exports,
    process: { env },
    console: { log() {} },
    require(name) {
      assert.equal(name, '@electron/notarize')
      return { notarize }
    },
  }, { filename: `${packageDir}scripts/notarize.js` })
  return exports.default
}

test('Mac release uses the afterSign hook without builder notarizing first', async () => {
  assert.equal(manifest.build.afterSign, 'scripts/notarize.js')
  assert.equal(manifest.build.mac.notarize, false)

  const calls = []
  const env = {
    APPLE_ID: 'release@example.com',
    APPLE_ID_PASS: 'app-specific-password',
    APPLE_TEAM_ID: 'TEAM123456',
  }
  const hook = loadNotarizationHook(env, async options => calls.push(options))
  for (const appOutDir of ['dist/mac', 'dist/mac-arm64']) {
    await hook({ electronPlatformName: 'darwin', appOutDir, packager: { appInfo: { productFilename: 'Quiet' } } })
  }
  assert.deepEqual(calls.map(({ tool, appPath, appleId, appleIdPassword, teamId }) => ({ tool, appPath, appleId, appleIdPassword, teamId })), [
    { tool: 'notarytool', appPath: 'dist/mac/Quiet.app', appleId: env.APPLE_ID, appleIdPassword: env.APPLE_ID_PASS, teamId: env.APPLE_TEAM_ID },
    { tool: 'notarytool', appPath: 'dist/mac-arm64/Quiet.app', appleId: env.APPLE_ID, appleIdPassword: env.APPLE_ID_PASS, teamId: env.APPLE_TEAM_ID },
  ])
})

test('E2E and pull request Mac builds skip release notarization', async () => {
  const calls = []
  const context = { electronPlatformName: 'darwin', appOutDir: 'dist/mac', packager: { appInfo: { productFilename: 'Quiet' } } }
  await loadNotarizationHook({ IS_E2E: 'true' }, async options => calls.push(options))(context)
  await loadNotarizationHook({ GITHUB_EVENT_NAME: 'pull_request' }, async options => calls.push(options))(context)
  assert.deepEqual(calls, [])
})
