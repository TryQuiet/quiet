// Requires the normal Android development toolchain and workspace dependencies.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { test } = require('node:test')

test('real Gradle asset staging removes stale addon slices when switching requested ABIs', () => {
  const mobile = path.resolve(__dirname, '..')
  const android = path.join(mobile, 'android')
  const output = path.join(android, 'build/nodejs-assets/nodejs-project')
  const source = path.join(mobile, 'nodejs-assets/deps/android/x64')
  const marker = path.join(source, `abi-staging-test-${process.pid}.txt`)
  fs.mkdirSync(source, { recursive: true })
  fs.writeFileSync(marker, 'public architecture staging fixture')
  const stage = architectures => execFileSync('./gradlew', [
    ':app:GenerateNodeProjectAssetsLists', '--max-workers=2',
    ...(architectures ? [`-PreactNativeArchitectures=${architectures}`] : []),
  ], { cwd: android, env: { ...process.env, ENVFILE: '../.env.detox' }, timeout: 180000, stdio: 'pipe' })
  try {
    stage('x86_64')
    assert.equal(fs.readFileSync(path.join(output, 'x64', path.basename(marker)), 'utf8'), 'public architecture staging fixture')
    assert.equal(fs.existsSync(path.join(output, 'arm64')), false)
    stage('arm64-v8a,x86_64')
    assert.ok(fs.existsSync(path.join(output, 'arm64/classic-level/classic_level.node')))
    assert.ok(fs.existsSync(path.join(output, 'x64', path.basename(marker))))
    stage()
    assert.ok(fs.existsSync(path.join(output, 'arm64/classic-level/classic_level.node')))
    assert.equal(fs.existsSync(path.join(output, 'x64')), false, 'default builds must remove stale emulator addons')
    assert.ok(!fs.readFileSync(path.join(android, 'build/nodejs-assets/file.list'), 'utf8').includes('/x64/'))
    assert.ok(fs.statSync(path.join(output, 'bundle.cjs')).size > 0, 'switching ABI must retain the backend')
  } finally {
    fs.unlinkSync(marker)
  }
})
