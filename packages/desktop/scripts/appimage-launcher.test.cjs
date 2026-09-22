const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const { generateAppRunScript } = require('app-builder-lib/out/targets/appimage/appImageUtil')
const AppImageTarget = require('app-builder-lib/out/targets/appimage/AppImageTarget').default
const { configureAppRun } = require('./appimage-launcher.cjs')
const afterPack = require('./afterPack.cjs').default
const { build, version } = require('../package.json')

const generated = generateAppRunScript({
  ExecutableName: build.linux.executableName,
  DesktopFileName: 'quiet.desktop',
  ProductFilename: build.productName,
  ProductName: build.productName,
  ResourceName: 'appimagekit-quiet',
})

function launch(t, { libraryPath, args = [], customize = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-apprun-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const appDir = path.join(directory, 'App dir')
  fs.mkdirSync(appDir)
  fs.writeFileSync(
    path.join(appDir, 'AppRun'),
    customize ? configureAppRun(generated, build.linux.executableName) : generated
  )
  // Simulate a machine whose namespace sandbox cannot be created.
  fs.writeFileSync(path.join(appDir, 'unshare'), '#!/bin/sh\nexit 1\n', { mode: 0o755 })
  fs.writeFileSync(
    path.join(appDir, build.linux.executableName),
    '#!/bin/sh\nprintf "%s\\0" "$LD_LIBRARY_PATH" "$LD_PRELOAD" "$@"\n',
    { mode: 0o755 }
  )
  const env = { PATH: '/usr/bin:/bin', APPDIR: appDir, APPIMAGE_SILENT_INSTALL: '1' }
  if (libraryPath !== undefined) env.LD_LIBRARY_PATH = libraryPath
  const result = spawnSync('/bin/bash', [path.join(appDir, 'AppRun'), ...args], {
    env,
    encoding: 'utf8',
    timeout: 5000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  const [actualPath, preload, ...actualArgs] = result.stdout.slice(0, -1).split('\0')
  return { appDir, actualPath, preload, actualArgs }
}

for (const libraryPath of [undefined, '', '/opt/quiet/lib:/usr/local/lib']) {
  test(`launcher preserves sandbox and safe library search with LD_LIBRARY_PATH=${JSON.stringify(libraryPath)}`, t => {
    const result = launch(t, { libraryPath, args: ['quiet://invite/hello', 'argument with spaces'] })
    assert.equal(result.actualPath, `${result.appDir}/usr/lib${libraryPath ? `:${libraryPath}` : ''}`)
    assert.ok(
      result.actualPath.split(':').every(Boolean),
      'must not introduce the working directory into library lookup'
    )
    assert.equal(result.preload, `${result.appDir}/usr/lib/libssl.so`)
    assert.deepEqual(result.actualArgs, ['quiet://invite/hello', 'argument with spaces'])
  })
}

test('launcher passes no arguments without adding a sandbox opt-out', t => {
  assert.deepEqual(launch(t).actualArgs, [])
})

test('launcher preserves an explicit sandbox opt-out for test environments', t => {
  assert.deepEqual(launch(t, { args: ['--no-sandbox', 'quiet://invite/hello'] }).actualArgs, [
    '--no-sandbox',
    'quiet://invite/hello',
  ])
})

test('regression fixture exercises the upstream automatic sandbox opt-out', t => {
  assert.deepEqual(launch(t, { customize: false }).actualArgs, ['--no-sandbox'])
})

test('configured desktop entry does not inject a sandbox opt-out', async () => {
  const packager = { config: build, platformSpecificBuildOptions: build.linux, appInfo: { buildVersion: version } }
  const helper = { computeDesktopEntry: (_options, exec) => exec }
  const target = new AppImageTarget('AppImage', packager, helper, os.tmpdir())
  assert.equal(await target.desktopEntry.value, 'AppRun %U')
})

test('unexpected builder templates stop packaging for review', () => {
  assert.throws(() => configureAppRun(generated, 'wrong-executable'), /Unrecognized AppRun executable/)
  assert.throws(
    () => configureAppRun(generated.replace('NO_SANDBOX=(--no-sandbox)', ''), build.linux.executableName),
    /Unrecognized AppRun sandbox policy/
  )
})

test('afterPack writes the customized executable launcher before artifact creation', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-afterpack-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const context = {
    electronPlatformName: 'darwin',
    appOutDir: directory,
    packager: {
      executableName: build.linux.executableName,
      appInfo: { productName: build.productName, productFilename: build.productName },
    },
  }
  await afterPack(context)
  const launcher = path.join(directory, 'AppRun')
  assert.equal(fs.existsSync(launcher), false)
  await afterPack({ ...context, electronPlatformName: 'linux' })
  assert.equal(fs.readFileSync(launcher, 'utf8'), configureAppRun(generated, build.linux.executableName))
  assert.ok(fs.statSync(launcher).mode & 0o111)
})
