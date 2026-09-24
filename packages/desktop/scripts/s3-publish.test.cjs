const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const http = require('node:http')
const https = require('node:https')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { spawnSync } = require('node:child_process')
const { CancellationToken, getS3LikeProviderBaseUrl } = require('builder-util-runtime')
const { S3Publisher } = require('electron-publish/out/s3/s3Publisher')
const { build, scripts } = require('../package.json')

for (const name of ['distUbuntu', 'distUbuntu:qss']) {
  test(`${name}: release-tag test builds never enable the publisher`, async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'quiet-publish-policy-'))
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    // Exercise the actual package script, replacing only expensive build steps
    // and the builder CLI with a probe of its real publishing policy engine.
    await fs.writeFile(path.join(directory, 'npm'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
    await fs.writeFile(path.join(directory, 'electron-builder'), `#!/usr/bin/env node
      const assert = require('node:assert/strict');
      const { PublishManager } = require(${JSON.stringify(require.resolve('app-builder-lib/out/publish/PublishManager'))});
      const { CancellationToken } = require(${JSON.stringify(require.resolve('builder-util-runtime'))});
      const args = process.argv.slice(2);
      assert.ok(args.includes('--linux'));
      const index = args.indexOf('--publish');
      const manager = new PublishManager({
        cancellationToken: new CancellationToken(), onAfterPack() {}, onArtifactCreated() {},
      }, { publish: index < 0 ? undefined : args[index + 1] });
      assert.equal(manager.isPublish, false, 'E2E builds must not publish');
    `, { mode: 0o755 })
    const env = {
      ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}`,
      CI: 'true', GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'release',
      GITHUB_REF: 'refs/tags/@quiet/desktop@11.2.0-alpha.1',
      GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: '@quiet/desktop@11.2.0-alpha.1',
      PUBLISH_FOR_PULL_REQUEST: 'true',
    }
    const run = command => spawnSync('bash', ['-c', command], { cwd: directory, env, encoding: 'utf8' })
    const oldBehavior = run(scripts[name].replace(' --publish never', ''))
    assert.notEqual(oldBehavior.status, 0)
    assert.match(oldBehavior.stderr, /E2E builds must not publish/)
    const result = run(scripts[name])
    assert.equal(result.status, 0, result.stderr)
  })
}

test('Linux releases verify builder metadata without rewriting its checksums', async () => {
  const workflow = await fs.readFile(path.resolve(__dirname, '../../../.github/workflows/desktop-build.yml'), 'utf8')
  const linux = workflow.split('  build-linux-prod:')[1].split('\n  build-macos-prod:')[0]
  assert.match(linux, /electron-builder -p always --linux/)
  assert.match(linux, /npm run test:packaged-appimage --prefix packages\/desktop/)
  assert.doesNotMatch(linux, /postBuild|CHECKSUM_PATH|Push electron-updater new checksum/)
  assert.equal(scripts.postBuild, undefined)
})

for (const bucket of ['test.quiet', 'quiet.11.x', 'quiet.12.x']) {
  test(`${bucket}: packaging resolves updater configuration without AWS access`, async t => {
    // Region discovery makes a signed request even for non-publishing builds.
    t.mock.method(https, 'request', () => { throw new Error('Packaging must not contact AWS') })
    const options = { ...build.publish, bucket }
    await S3Publisher.checkAndResolveOptions(options, 'alpha', true)
    assert.equal(options.region, 'us-east-1')
    assert.equal(getS3LikeProviderBaseUrl(options), `https://s3.amazonaws.com/${bucket}`)
  })

  test(`${bucket}: publisher streams artifacts using a TLS-safe S3 hostname`, async t => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'quiet-s3-publish-'))
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    const file = path.join(directory, 'Quiet-11.2.0-alpha.0.AppImage')
    const contents = Buffer.from('AppImage upload regression fixture\n')
    await fs.writeFile(file, contents)
    const received = []
    const server = http.createServer(async (req, res) => {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      received.push({ method: req.method, url: req.url, body: Buffer.concat(chunks) })
      res.writeHead(200)
      res.end()
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    t.after(() => new Promise(resolve => server.close(resolve)))
    // Keep the real publisher's signing, URL construction, and file streaming;
    // redirect only the transport to a local receiver so no release is uploaded.
    t.mock.method(https, 'request', (options, callback) => {
      assert.equal(options.hostname, 's3.us-east-1.amazonaws.com')
      assert.equal(options.headers.Host, 's3.us-east-1.amazonaws.com')
      assert.match(options.headers.Authorization, /Credential=fixture-access-key\//)
      return http.request({ ...options, hostname: '127.0.0.1', port: server.address().port }, callback)
    })
    const publisher = new S3Publisher({ cancellationToken: new CancellationToken() }, { ...build.publish, bucket })
    const uploadConfig = publisher.getS3UploadConfig()
    t.mock.method(publisher, 'getS3UploadConfig', () => ({
      ...uploadConfig,
      credentials: { accessKeyId: 'fixture-access-key', secretAccessKey: 'fixture-secret-key' },
    }))
    await publisher.upload({ file })
    assert.deepEqual(received, [{ method: 'PUT', url: `/${bucket}/${path.basename(file)}`, body: contents }])
  })
}
