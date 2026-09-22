const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const http = require('node:http')
const https = require('node:https')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { CancellationToken, getS3LikeProviderBaseUrl } = require('builder-util-runtime')
const { S3Publisher } = require('electron-publish/out/s3/s3Publisher')
const { build } = require('../package.json')

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
