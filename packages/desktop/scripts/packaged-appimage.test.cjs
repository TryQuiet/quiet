// QUIET_TEST_APPIMAGE=/absolute/path/Quiet.AppImage npm run test:packaged-appimage
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const zlib = require('node:zlib')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const yaml = require('js-yaml')
const { build } = require('../package.json')

test('final AppImage resolves production dependencies and has matching update metadata', t => {
  assert.ok(process.env.QUIET_TEST_APPIMAGE, 'Set QUIET_TEST_APPIMAGE to the built AppImage')
  const artifact = path.resolve(process.env.QUIET_TEST_APPIMAGE)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-packaged-appimage-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const extraction = spawnSync(artifact, ['--appimage-extract'], { cwd: directory, stdio: 'ignore', timeout: 30_000 })
  assert.ifError(extraction.error)
  assert.equal(extraction.status, 0)
  const appDir = path.join(directory, 'squashfs-root')
  const launcher = fs.readFileSync(path.join(appDir, 'AppRun'), 'utf8')
  assert.ok(launcher.includes('NO_SANDBOX=()'))
  assert.ok(!launcher.includes('--no-sandbox'), 'packaged launcher must not disable the sandbox automatically')
  assert.ok(launcher.includes('export LD_PRELOAD="${APPDIR}/usr/lib/libssl.so"'))
  const desktopFiles = fs.readdirSync(appDir).filter(name => name.endsWith('.desktop'))
  assert.ok(desktopFiles.length > 0)
  for (const name of desktopFiles) {
    assert.match(fs.readFileSync(path.join(appDir, name), 'utf8'), /^Exec=AppRun %U$/m)
  }

  // Execute the shipped Electron and resolve modules from its actual asar. This
  // catches production dependency omissions that source-tree tests cannot see.
  const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  const run = spawnSync(
    path.join(appDir, build.linux.executableName),
    [
      '-e',
      `const assert = require('node:assert/strict');
       const load = require('node:module').createRequire(process.argv[1]);
       for (const name of ['electron-store', 'electron-updater', 'pkijs']) {
         assert.ok(load.resolve(name).startsWith(require('node:path').dirname(process.argv[1]) + '/'));
       }
       assert.equal(load('pkijs/package.json').version, '3.0.15');
       console.log('Packaged runtime dependencies resolved');`,
      path.join(appDir, 'resources/app.asar/package.json'),
    ],
    { env, encoding: 'utf8', timeout: 15_000 }
  )
  assert.ifError(run.error)
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /Packaged runtime dependencies resolved/)

  const data = fs.readFileSync(artifact)
  const digest = crypto.createHash('sha512').update(data).digest('base64')
  const manifests = fs.readdirSync(path.dirname(artifact)).filter(name => name.endsWith('-linux.yml'))
  const matching = manifests
    .map(name => yaml.load(fs.readFileSync(path.join(path.dirname(artifact), name), 'utf8')))
    .filter(info => info.path === path.basename(artifact))
  assert.ok(matching.length > 0, 'final artifact must have update metadata')
  for (const info of matching) {
    assert.equal(info.sha512, digest)
    const file = info.files.find(file => file.url === path.basename(artifact))
    assert.ok(file)
    assert.equal(file.sha512, digest)
    assert.equal(file.size, data.length)
  }
  const blockmapSize = data.readUInt32BE(data.length - 4)
  const blockmap = JSON.parse(zlib.inflateRawSync(data.subarray(data.length - 4 - blockmapSize, data.length - 4)))
  assert.ok(blockmap.files.length > 0, 'embedded differential update blockmap must survive launcher customization')
})
