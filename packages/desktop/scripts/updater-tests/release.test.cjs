const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { promisify } = require('node:util')
const { execFile } = require('node:child_process')
const { repository } = require('./repository.cjs')
const { stage, artifacts } = require('../releaseUpdate.cjs')
const { buildTrust, beforePack, afterPack } = require('../updateTrust.cjs')
const yaml = require('js-yaml')

test('final staged bytes pass independent HTTPS/TUF publication gate; altered or unsigned candidates do not', async t => {
  const previous = Object.fromEntries(['GITHUB_EVENT_NAME', 'IS_LOCAL', 'IS_E2E'].map(name => [name, process.env[name]]))
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value } })
  process.env.GITHUB_EVENT_NAME = 'release'
  delete process.env.IS_LOCAL
  delete process.env.IS_E2E
  const repo = await repository(t, 'linux', true)
  const published = repo.publish()
  const project = path.join(repo.directory, 'project')
  const resources = path.join(project, 'dist/linux-unpacked/resources')
  fs.mkdirSync(resources, { recursive: true })
  fs.mkdirSync(path.join(project, 'build/update-trust/latest'), { recursive: true })
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ version: '2.0.0' }))
  const { rootPath, ...trust } = repo.trust
  fs.writeFileSync(path.join(project, 'build/update-trust.json'), JSON.stringify({ windowsPublisherNames: trust.windowsPublisherNames, repositories: { latest: trust } }))
  fs.copyFileSync(rootPath, path.join(project, 'build/update-trust/latest/root.json'))
  await afterPack({ electronPlatformName: 'linux', appOutDir: path.dirname(resources), packager: {
    projectDir: project, appInfo: { version: '2.0.0' }, getResourcesDir: () => resources,
  } })
  assert.deepEqual(fs.readFileSync(path.join(resources, 'update-root.json')), fs.readFileSync(rootPath))
  fs.writeFileSync(path.join(project, 'dist/latest-linux.yml'), published.manifest)
  fs.writeFileSync(path.join(project, 'dist', published.artifactName), published.artifact)
  const candidate = path.join(repo.directory, 'candidate')
  await stage(project, 'linux', candidate)
  const receipt = JSON.parse(fs.readFileSync(path.join(candidate, 'release.json')))
  assert.equal(receipt.target, `linux/${process.arch}/latest.yml`)
  const filesOnly = path.join(repo.directory, 'artifacts-only')
  await artifacts(project, candidate, filesOnly)
  assert.deepEqual(fs.readdirSync(filesOnly), [published.artifactName])
  const verify = output => promisify(execFile)(process.execPath,
    [path.resolve(__dirname, '../releaseUpdate.cjs'), 'verify', project, candidate, output],
    { env: { ...process.env, NODE_EXTRA_CA_CERTS: repo.certificate } })
  const output = path.join(repo.directory, 'channel-only')
  await verify(output)
  assert.deepEqual(fs.readdirSync(output), ['latest-linux.yml'])
  assert.deepEqual(fs.readFileSync(path.join(output, 'latest-linux.yml')), published.manifest)
  fs.appendFileSync(path.join(candidate, 'latest-linux.yml'), '\n# changed after signing\n')
  await assert.rejects(verify(path.join(repo.directory, 'changed')))
  fs.writeFileSync(path.join(candidate, 'latest-linux.yml'), published.manifest)
  repo.objects.delete('/metadata/timestamp.json')
  await assert.rejects(verify(path.join(repo.directory, 'unsigned')))
  fs.writeFileSync(path.join(project, 'dist', published.artifactName), 'changed after packaging')
  await assert.rejects(stage(project, 'linux', path.join(repo.directory, 'tampered')))
})

test('release trust and Windows publisher generation cannot be bypassed by prerelease TEST_MODE', async t => {
  const repo = await repository(t)
  const project = path.join(repo.directory, 'project')
  fs.mkdirSync(path.join(project, 'build/update-trust/alpha'), { recursive: true })
  const config = { windowsPublisherNames: repo.trust.windowsPublisherNames, repositories: { alpha: {
    metadataBaseUrl: 'https://updates.example/metadata/', targetBaseUrl: 'https://updates.example/targets/', artifactBaseUrl: 'https://downloads.example/' } } }
  const write = () => fs.writeFileSync(path.join(project, 'build/update-trust.json'), JSON.stringify(config))
  write()
  fs.copyFileSync(repo.trust.rootPath, path.join(project, 'build/update-trust/alpha/root.json'))
  const previous = { TEST_MODE: process.env.TEST_MODE, IS_LOCAL: process.env.IS_LOCAL, IS_E2E: process.env.IS_E2E, GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME }
  process.env.TEST_MODE = 'true'
  delete process.env.IS_LOCAL
  delete process.env.IS_E2E
  process.env.GITHUB_EVENT_NAME = 'release'
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value } })
  const packager = { projectDir: project, appInfo: { version: '2.0.0-alpha.0' }, config: { win: {} } }
  await beforePack({ electronPlatformName: 'win32', packager })
  assert.equal(packager.config.forceCodeSigning, true)
  assert.deepEqual(packager.config.win.signtoolOptions.publisherName, repo.trust.windowsPublisherNames)
  // Exercise the maintained builder's actual publisher computation used by app-update.yml.
  const { WindowsSignToolManager } = require('app-builder-lib/out/codeSign/windowsSignToolManager')
  const signer = new WindowsSignToolManager({ platformSpecificBuildOptions: packager.config.win })
  assert.deepEqual(await signer.computedPublisherName.value, repo.trust.windowsPublisherNames)
  config.windowsPublisherNames = []
  write()
  assert.throws(() => buildTrust(project, '2.0.0-alpha.0', 'win32'))
  config.repositories.alpha = null
  write()
  assert.throws(() => buildTrust(project, '2.0.0-alpha.0', 'linux'))
})


test('release-triggered E2E workflows explicitly build previews without production trust or signing', async t => {
  const previous = Object.fromEntries(['GITHUB_EVENT_NAME', 'IS_LOCAL', 'IS_E2E', 'TEST_MODE'].map(name => [name, process.env[name]]))
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value } })
  process.env.GITHUB_EVENT_NAME = 'release'
  delete process.env.IS_LOCAL
  const workflows = path.resolve(__dirname, '../../../..', '.github/workflows')
  for (const name of ['e2e-linux.yml', 'e2e-win.yml', 'e2e-back-compat-linux.yml', 'e2e-qss-linux.yml', 'e2e-mac.yml']) {
    const workflow = yaml.load(fs.readFileSync(path.join(workflows, name), 'utf8'))
    const job = Object.values(workflow.jobs)[0]
    assert.equal(String(job.env.IS_E2E), 'true', name)
    process.env.IS_E2E = String(job.env.IS_E2E)
    process.env.TEST_MODE = String(job.env.TEST_MODE)
    for (const electronPlatformName of ['linux', 'win32']) {
      // No projectDir/root/certificate exists: invoking either production hook would fail.
      const context = { electronPlatformName, packager: { config: { win: {} } } }
      await beforePack(context)
      await afterPack(context)
      assert.equal(context.packager.config.forceCodeSigning, undefined)
    }
  }
})
