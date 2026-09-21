const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { releaseBucket } = require('./releaseBucket')

const root = path.resolve(__dirname, '../../..')
const workflow = fs.readFileSync(path.join(root, '.github/workflows/desktop-build.yml'), 'utf8')

function resolveInActions(t, version, action, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-release-bucket-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const packagePath = path.join(directory, 'package.json')
  const eventPath = path.join(directory, 'event.json')
  const outputPath = path.join(directory, 'output')
  fs.writeFileSync(packagePath, JSON.stringify({ version, build: { publish: { provider: 's3', bucket: 'test.quiet' } } }))
  fs.writeFileSync(eventPath, JSON.stringify({ action, release: { tag_name: `@quiet/desktop@${version}` }, ...overrides }))
  fs.writeFileSync(outputPath, '')
  const result = spawnSync(process.execPath, [path.join(__dirname, 'releaseBucket.js'), packagePath], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: 'release', GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: outputPath },
  })
  return { ...result, output: fs.readFileSync(outputPath, 'utf8'), packagePath }
}

for (const [version, bucket] of [
  ['9.0.3', 'quiet.9.x'],
  ['11.0.1', 'quiet.11.x'],
  ['11.1.0', 'quiet.11.x'],
  ['12.0.0', 'quiet.12.x'],
  ['100.2.3', 'quiet.100.x'],
]) {
  test(`release event for ${version} publishes to ${bucket}`, t => {
    const result = resolveInActions(t, version, 'released')
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.output, `bucket=${bucket}\n`)
  })
}

test('prereleases continue using the test feed after a major version bump', t => {
  for (const version of ['11.0.1-alpha.0', '12.0.0-alpha.1']) {
    const result = resolveInActions(t, version, 'prereleased')
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.output, 'bucket=test.quiet\n')
  }
})

test('release tags, versions and event actions must agree before any bucket is emitted', t => {
  for (const [version, action, overrides] of [
    ['11.0.1', 'released', { release: { tag_name: '@quiet/desktop@9.0.3' } }],
    ['11.0.1', 'released', { release: { tag_name: '@quiet/mobile@11.0.1' } }],
    ['11.0.1-alpha.0', 'released'],
    ['11.0.1', 'prereleased'],
    ['11.0.1', 'edited'],
    ['11.0', 'released'],
    ['011.0.1', 'released'],
    ['11.0.1-alpha.01', 'prereleased'],
  ]) {
    const result = resolveInActions(t, version, action, overrides)
    assert.notEqual(result.status, 0, `${version}, ${action} should fail`)
    assert.equal(result.output, '', 'a rejected release must not select a destination')
  }
})

test('the production mac packaging helper embeds the resolved major-version bucket', t => {
  const result = resolveInActions(t, '12.0.0', 'released')
  assert.equal(result.status, 0, result.stderr)
  const bucket = result.output.trim().split('=')[1]
  const packaging = spawnSync(process.execPath, [
    path.join(__dirname, 'macUpdateMetadata.js'), 'disable-publish', '--package', result.packagePath, '--bucket', bucket,
  ], { encoding: 'utf8' })
  assert.equal(packaging.status, 0, packaging.stderr)
  assert.deepEqual(JSON.parse(fs.readFileSync(result.packagePath, 'utf8')).build.publish, {
    provider: 's3', bucket: 'quiet.12.x', publishAutoUpdate: false,
  })
})

test('all desktop publishers depend on and consume the same resolved bucket', () => {
  const jobs = Object.fromEntries([...workflow.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:\n|$(?![\s\S]))/gm)]
    .map(match => [match[1], match[2]]))
  const publishers = Object.entries(jobs).filter(([, body]) => /^      S3_BUCKET:/m.test(body))
  assert.deepEqual(publishers.map(([name]) => name).sort(), [
    'build-linux-prod', 'build-macos-arm64-prod', 'build-macos-prod', 'build-windows-prod', 'publish-macos-update-metadata',
  ].sort())
  for (const [name, body] of publishers) {
    assert.match(body, /needs:\n(?:      - [\w-]+\n)*      - resolve-update-bucket\n/, `${name} must wait for bucket resolution`)
    assert.match(body, /S3_BUCKET: \$\{\{ needs\.resolve-update-bucket\.outputs\.bucket \}\}/, `${name} must use the resolved bucket`)
  }
  assert.match(jobs['resolve-update-bucket'], /run: node packages\/desktop\/scripts\/releaseBucket\.js/)
  assert.match(jobs['resolve-update-bucket'], /bucket: \$\{\{ steps\.bucket\.outputs\.bucket \}\}/)
  assert.match(jobs['resolve-update-bucket'], /node --test packages\/desktop\/scripts\/releaseBucket\.test\.js/)
  assert.doesNotMatch(workflow, /quiet\.\d+\.x/, 'the workflow must never pin a production major')
  for (const name of ['build-linux-prod', 'build-windows-prod']) {
    assert.match(jobs[name], /-c\.publish\.bucket=\$S3_BUCKET/, `${name} must embed the resolved bucket`)
  }
  for (const name of ['build-macos-prod', 'build-macos-arm64-prod']) {
    assert.match(jobs[name], /--bucket "\$S3_BUCKET"/, `${name} must embed the resolved bucket`)
  }
})

test('the checked-in desktop version determines its production bucket', () => {
  const { version } = require('../package.json')
  const action = version.includes('-') ? 'prereleased' : 'released'
  assert.equal(releaseBucket(version, action), action === 'released' ? `quiet.${version.split('.')[0]}.x` : 'test.quiet')
})
