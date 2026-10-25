/**
 * @jest-environment node
 */
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { AddressInfo } from 'net'
import { AppImageUpdater, NsisUpdater, AppUpdater } from 'electron-updater'
import type { AppAdapter } from 'electron-updater/out/AppAdapter'
import { configureRequestOptions, configureRequestUrl } from 'builder-util-runtime'
import { NodeHttpExecutor } from 'builder-util/out/nodeHttpExecutor'
import { hardenUpdater, updateStatement, verifyUpdateSignature, UPDATE_SIGNING_PUBLIC_KEYS } from './updaterSecurity'

/**
 * The updater's own executor is built on Electron's `net`, which a Node test cannot load. This one
 * fetches over plain Node but reuses the updater's real download path (HttpExecutor.doDownload),
 * which is where the feed's sha512 and size are checked.
 */
class TestHttpExecutor extends NodeHttpExecutor {
  download(url: URL, destination: string, options: any): Promise<string> {
    return options.cancellationToken.createPromise((resolve: (path: string) => void, reject: any, onCancel: any) => {
      const requestOptions: any = { headers: options.headers || undefined, redirect: 'manual' }
      configureRequestUrl(url, requestOptions)
      configureRequestOptions(requestOptions)
      ;(this as any).doDownload(
        requestOptions,
        {
          destination,
          options,
          onCancel,
          callback: (error: Error | null) => (error == null ? resolve(destination) : reject(error)),
          responseHandler: null,
        },
        0
      )
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const updateSigning = require('../../scripts/updateSigning.cjs')

const sha512 = (data: Buffer) => crypto.createHash('sha512').update(data).digest('base64')

const VERSION = '99.0.0'

let workDir: string
let server: http.Server
let feedUrl: string
// path -> body; swapped per test to model a feed that was tampered with
let served: Record<string, Buffer>
// paths whose response is held back until the promise resolves, to overlap requests deliberately
let held: Record<string, Promise<void>> = {}

beforeAll(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-updater-sec-'))
  server = http.createServer(async (req, res) => {
    const requested = decodeURIComponent((req.url ?? '').split('?')[0])
    await held[requested]
    const body = served[requested]
    if (!body) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-length': body.length }).end(body)
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  feedUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
  fs.rmSync(workDir, { recursive: true, force: true })
})

const makeAdapter = (name: string, updateConfig: string, existingDir?: string, version = '1.0.0'): AppAdapter => {
  const dir = existingDir ?? fs.mkdtempSync(path.join(workDir, `${name}-`))
  const appUpdateConfigPath = path.join(dir, 'app-update.yml')
  fs.writeFileSync(appUpdateConfigPath, updateConfig)
  return {
    version,
    name: 'Quiet',
    isPackaged: true,
    appUpdateConfigPath,
    userDataPath: dir,
    baseCachePath: path.join(dir, 'cache'),
    whenReady: async () => undefined,
    relaunch: () => undefined,
    quit: () => undefined,
    onQuit: () => undefined,
  }
}

const updateConfig = () => `provider: generic\nurl: ${feedUrl}\n`

const newKey = () => {
  const { privateKey } = crypto.generateKeyPairSync('ed25519')
  return { privateKey, publicKey: updateSigning.publicKeyOf(privateKey) as string }
}
const releaseKey = newKey()

// Signs `bytes` the way the release pipeline does (scripts/updateSigning.cjs) and returns the
// contents of the `<name>.sig` file it publishes.
const signedAs = (name: string, bytes: Buffer, version = VERSION, key = releaseKey) => {
  const file = path.join(fs.mkdtempSync(path.join(workDir, 'sign-')), name)
  fs.writeFileSync(file, bytes)
  return fs.readFileSync(updateSigning.signFile(file, version, key.privateKey))
}

// Which channel file the updater requests depends on the host running the test (latest.yml,
// latest-linux.yml or latest-mac.yml), whatever updater class is under test.
const serveFeed = (feed: Buffer, files: Record<string, Buffer>) => {
  served = { '/latest.yml': feed, '/latest-linux.yml': feed, '/latest-mac.yml': feed, ...files }
}

const feedFile = (name: string, payload: Buffer, declared = payload) =>
  `version: ${VERSION}\nfiles:\n  - url: ${name}\n    sha512: ${sha512(declared)}\n    size: ${declared.length}\n` +
  `path: ${name}\nsha512: ${sha512(declared)}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`

const configure = (updater: AppUpdater) => {
  // Passing an app adapter leaves the executor unset because the default one needs Electron's net.
  ;(updater as unknown as { httpExecutor: TestHttpExecutor }).httpExecutor = new TestHttpExecutor()
  updater.autoDownload = false
  updater.autoInstallOnAppQuit = false
  updater.disableDifferentialDownload = true
  return updater
}

const download = async (updater: AppUpdater) => {
  const result = await updater.checkForUpdates()
  expect(result?.updateInfo.version).toBe(VERSION)
  return updater.downloadUpdate()
}

describe('hardenUpdater', () => {
  const hooks = () => ({ executeDownload: jest.fn(), getOrCreateDownloadHelper: jest.fn() })

  it('refuses downgrades and web installers on every platform', () => {
    for (const platform of ['linux', 'darwin', 'win32'] as const) {
      const updater = { allowDowngrade: true, disableWebInstaller: false, ...hooks() }
      hardenUpdater(updater as unknown as AppUpdater, platform, { publicKeys: [releaseKey.publicKey] })
      expect(updater.allowDowngrade).toBe(false)
      expect(updater.disableWebInstaller).toBe(true)
    }
  })

  it('leaves macOS downloads to Squirrel.Mac', () => {
    const updater = hooks()
    const { executeDownload } = updater
    hardenUpdater(updater as unknown as AppUpdater, 'darwin', { publicKeys: [] })
    expect(updater.executeDownload).toBe(executeDownload)
  })

  it.each(['win32', 'linux'] as const)('fails closed on %s without a signing key', platform => {
    expect(() => hardenUpdater(hooks() as unknown as AppUpdater, platform, { publicKeys: [] })).toThrow(
      /no update signing key/
    )
  })

  it('fails closed on a malformed signing key', () => {
    expect(() => hardenUpdater(hooks() as unknown as AppUpdater, 'win32', { publicKeys: ['not a key'] })).toThrow()
  })

  it('fails closed when electron-updater no longer exposes its download hooks', () => {
    expect(() => hardenUpdater({} as unknown as AppUpdater, 'linux', { publicKeys: [releaseKey.publicKey] })).toThrow(
      /download hooks/
    )
  })

  it('ships real Ed25519 keys', () => {
    expect(UPDATE_SIGNING_PUBLIC_KEYS.length).toBeGreaterThan(0)
    for (const key of UPDATE_SIGNING_PUBLIC_KEYS) {
      const parsed = crypto.createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' })
      expect(parsed.asymmetricKeyType).toBe('ed25519')
    }
  })

  it('signs the same statement the app verifies', () => {
    expect(updateSigning.updateStatement('1.2.3', 'Quiet Setup 1.2.3.exe', 'abc==')).toBe(
      updateStatement('1.2.3', 'Quiet Setup 1.2.3.exe', 'abc==')
    )
  })
})

describe('verifyUpdateSignature', () => {
  const name = 'Quiet-Setup-99.0.0.exe'
  const bytes = Buffer.from('MZ pretend installer '.repeat(100))
  const file = () => {
    const filePath = path.join(fs.mkdtempSync(path.join(workDir, 'verify-')), name)
    fs.writeFileSync(filePath, bytes)
    return filePath
  }
  const signatureUrl = new URL(`http://feed.test/${name}.sig`)
  const verify = (
    fetchSignature: () => Promise<string>,
    keys = [releaseKey.publicKey],
    version: string | null = VERSION
  ) =>
    verifyUpdateSignature(
      { filePath: file(), fileName: name, version: version ?? undefined, signatureUrl },
      keys,
      fetchSignature
    )
  const genuine = () => signedAs(name, bytes).toString()

  it('accepts a signature from the release key', async () => {
    await expect(verify(async () => genuine())).resolves.toBeNull()
  })

  it('accepts a signature from any key in the list, so keys can be rotated', async () => {
    const next = newKey()
    await expect(
      verify(async () => signedAs(name, bytes, VERSION, next).toString(), [releaseKey.publicKey, next.publicKey])
    ).resolves.toBeNull()
  })

  it('rejects a signature from a key that is not in the list', async () => {
    await expect(verify(async () => signedAs(name, bytes, VERSION, newKey()).toString())).resolves.toMatch(
      /does not match/
    )
  })

  it('rejects when no key is configured or the version is unknown', async () => {
    await expect(verify(async () => genuine(), [])).resolves.toMatch(/no release signing key/)
    await expect(verify(async () => genuine(), [releaseKey.publicKey], null)).resolves.toMatch(/version is unknown/)
  })

  it('rejects when the signature cannot be fetched', async () => {
    await expect(
      verify(async () => {
        throw new Error('HTTP 404')
      })
    ).resolves.toMatch(/could not fetch the signature.*HTTP 404/)
  })

  it.each([
    ['empty', ''],
    ['not base64', 'x'.repeat(88)],
    ['too short', (text: string) => text.slice(0, 40)],
    ['too long', (text: string) => `${text.trim()}AAAA`],
  ])('rejects a %s signature file', async (_label, text) => {
    await expect(verify(async () => (typeof text === 'string' ? text : text(genuine())))).resolves.toMatch(/malformed/)
  })

  it('rejects a flipped signature bit', async () => {
    const raw = Buffer.from(genuine().trim(), 'base64')
    raw[0] ^= 1
    await expect(verify(async () => raw.toString('base64'))).resolves.toMatch(/does not match/)
  })

  it.each([
    ['a version with a newline', '99.0.0\nfile:evil', name],
    ['a version that is not semver', 'latest', name],
    ['a file name with a newline', VERSION, 'Quiet\nsha512:x.exe'],
  ])('rejects %s before verifying anything', async (_label, version, fileName) => {
    const fetchSignature = jest.fn(async () => genuine())
    await expect(
      verifyUpdateSignature(
        { filePath: file(), fileName, version, signatureUrl },
        [releaseKey.publicKey],
        fetchSignature
      )
    ).resolves.toMatch(/malformed/)
    expect(fetchSignature).not.toHaveBeenCalled()
  })

  it('tolerates surrounding whitespace in the signature file', async () => {
    await expect(verify(async () => `\n  ${genuine().trim()} \r\n`)).resolves.toBeNull()
  })

  it('rejects a signature made for another version, file name or content', async () => {
    await expect(verify(async () => signedAs(name, bytes, '98.0.0').toString())).resolves.toMatch(/does not match/)
    await expect(verify(async () => signedAs('Other.exe', bytes).toString())).resolves.toMatch(/does not match/)
    await expect(verify(async () => signedAs(name, Buffer.from('other bytes')).toString())).resolves.toMatch(
      /does not match/
    )
  })
})

describe('update feed served from a local HTTP server', () => {
  // AppImageUpdater only considers itself active when running from an AppImage.
  const originalAppImage = process.env.APPIMAGE
  beforeAll(() => {
    process.env.APPIMAGE = path.join(os.tmpdir(), 'Quiet-1.0.0.AppImage')
  })
  afterAll(() => {
    if (originalAppImage === undefined) delete process.env.APPIMAGE
    else process.env.APPIMAGE = originalAppImage
  })

  const platforms = [
    {
      title: 'Linux (AppImage)',
      platform: 'linux' as const,
      name: 'Quiet-99.0.0.AppImage',
      create: (adapter: AppAdapter) => new AppImageUpdater(undefined, adapter),
    },
    {
      title: 'Windows (NSIS)',
      platform: 'win32' as const,
      name: 'Quiet-Setup-99.0.0.exe',
      create: (adapter: AppAdapter) => new NsisUpdater(undefined, adapter),
    },
  ]

  describe.each(platforms.map(p => [p.title, p] as const))(
    '%s: downloads need a release-key signature',
    (_title, { platform, name, create }) => {
      const genuine = Buffer.from(`genuine ${platform} update `.repeat(500))

      const makeUpdater = (existingDir?: string, harden = true, publicKeys = [releaseKey.publicKey]) => {
        const updater = configure(create(makeAdapter(platform, updateConfig(), existingDir)))
        if (harden) hardenUpdater(updater, platform, { publicKeys })
        return updater
      }

      const serve = (payload: Buffer, signature: Buffer | null, declared = payload) =>
        serveFeed(Buffer.from(feedFile(name, declared)), {
          [`/${name}`]: payload,
          ...(signature ? { [`/${name}.sig`]: signature } : {}),
        })

      const installerOf = (updater: AppUpdater) =>
        (updater as unknown as { installerPath: string | null }).installerPath

      beforeEach(() => {
        held = {}
      })

      it('installs an update signed by the release key (control)', async () => {
        serve(genuine, signedAs(name, genuine))
        const updater = makeUpdater()
        const downloaded = await download(updater)
        expect(fs.readFileSync(downloaded[0])).toEqual(genuine)
        expect(installerOf(updater)).toBe(downloaded[0])
      })

      it('rejects swapped bytes even though the feed hash was updated to match them', async () => {
        // An attacker who controls the bucket controls the file and its hash, but not the key.
        const malicious = Buffer.from('malicious payload '.repeat(500))
        serve(malicious, signedAs(name, genuine))
        const updater = makeUpdater()
        await expect(download(updater)).rejects.toThrow(/not signed by the Quiet release key.*does not match/)
        expect(installerOf(updater)).toBeNull()
      })

      it('rejects an update with no signature file', async () => {
        serve(genuine, null)
        const updater = makeUpdater()
        await expect(download(updater)).rejects.toThrow(/could not fetch the signature.*404/)
        expect(installerOf(updater)).toBeNull()
      })

      it('rejects an update signed by another key', async () => {
        serve(genuine, signedAs(name, genuine, VERSION, newKey()))
        await expect(download(makeUpdater())).rejects.toThrow(/does not match/)
      })

      it('rejects an older, genuinely signed update replayed under a newer announced version', async () => {
        serve(genuine, signedAs(name, genuine, '98.0.0'))
        await expect(download(makeUpdater())).rejects.toThrow(/does not match/)
      })

      it('rejects a genuine signature that belongs to a different file', async () => {
        serve(genuine, signedAs('Quiet-other-99.0.0.bin', genuine))
        await expect(download(makeUpdater())).rejects.toThrow(/does not match/)
      })

      it('rejects a garbage signature file', async () => {
        serve(genuine, Buffer.from('<html>not a signature</html>'))
        await expect(download(makeUpdater())).rejects.toThrow(/malformed/)
      })

      it('still rejects a hash mismatch before any signature is considered', async () => {
        const fetchSignature = jest.fn(async () => signedAs(name, genuine).toString())
        serve(Buffer.concat([genuine, Buffer.from('x')]), null, genuine)
        const updater = configure(create(makeAdapter(platform, updateConfig())))
        hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey], fetchSignature })
        await expect(download(updater)).rejects.toThrow(/sha512 checksum mismatch|size/i)
        expect(fetchSignature).not.toHaveBeenCalled()
      })

      it('does not reuse an update cached by an earlier launch without verifying it against the new announcement', async () => {
        const dir = fs.mkdtempSync(path.join(workDir, `${platform}-cache-`))
        // Launch 1: a genuine 98.0.0 is downloaded and verified, but never installed.
        serveFeed(Buffer.from(feedFile(name, genuine).replace(VERSION, '98.0.0')), {
          [`/${name}`]: genuine,
          [`/${name}.sig`]: signedAs(name, genuine, '98.0.0'),
        })
        const first = makeUpdater(dir)
        expect((await first.checkForUpdates())?.updateInfo.version).toBe('98.0.0')
        await first.downloadUpdate()

        // Launch 2: the feed now announces 99.0.0 but points at the very same bytes and hash.
        serve(genuine, signedAs(name, genuine, '98.0.0'))
        await expect(download(makeUpdater(dir))).rejects.toThrow(/does not match/)
      })

      it('verifies a download against the version announced when it started, even if a newer check lands meanwhile', async () => {
        serve(genuine, signedAs(name, genuine))
        let release: () => void = () => undefined
        held[`/${name}`] = new Promise<void>(resolve => (release = resolve))
        const updater = makeUpdater()
        expect((await updater.checkForUpdates())?.updateInfo.version).toBe(VERSION)
        const downloading = updater.downloadUpdate()

        // While the file is still in flight the feed moves on and the periodic check runs.
        const newerFeed = feedFile(name, genuine).replace(VERSION, '99.1.0')
        served['/latest.yml'] = served['/latest-linux.yml'] = served['/latest-mac.yml'] = Buffer.from(newerFeed)
        expect((await updater.checkForUpdates())?.updateInfo.version).toBe('99.1.0')

        release()
        await expect(downloading).resolves.toHaveLength(1)
      })

      describe('release channels', () => {
        const prerelease = '99.0.0-alpha.1'
        const servePrerelease = () => {
          serveFeed(Buffer.from(feedFile(name, genuine).replace(VERSION, prerelease)), {
            [`/${name}`]: genuine,
            [`/${name}.sig`]: signedAs(name, genuine, prerelease),
          })
        }
        const updaterAt = (installed: string) => {
          const updater = configure(create(makeAdapter(platform, updateConfig(), undefined, installed)))
          hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey] })
          return updater
        }

        it('does not move a stable install onto a genuinely signed pre-release', async () => {
          servePrerelease()
          const updater = updaterAt('1.0.0')
          expect((await updater.checkForUpdates())?.updateInfo.version).toBe(prerelease)
          await expect(updater.downloadUpdate()).rejects.toThrow(/Pre-release .* not offered to a stable/)
          expect(installerOf(updater)).toBeNull()
        })

        it('updates a pre-release install to a signed pre-release', async () => {
          servePrerelease()
          const updater = updaterAt('1.0.0-alpha.1')
          expect((await updater.checkForUpdates())?.updateInfo.version).toBe(prerelease)
          await expect(updater.downloadUpdate()).resolves.toHaveLength(1)
        })
      })

      it('without hardenUpdater the same unsigned update is accepted (the old behaviour)', async () => {
        serve(genuine, null)
        await expect(download(makeUpdater(undefined, false))).resolves.toHaveLength(1)
      })
    }
  )
})
