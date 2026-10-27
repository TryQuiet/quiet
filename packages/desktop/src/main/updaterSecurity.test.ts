/**
 * @jest-environment node
 */
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { AddressInfo } from 'net'
import { AppImageUpdater, NsisUpdater, AppUpdater } from 'electron-updater'
import type { AppAdapter } from 'electron-updater/out/AppAdapter'
import { configureRequestOptions, configureRequestUrl } from 'builder-util-runtime'
import { NodeHttpExecutor } from 'builder-util/out/nodeHttpExecutor'
const mockOpenPath = jest.fn()
jest.mock('electron', () => ({ shell: { openPath: (...args: unknown[]) => mockOpenPath(...args) } }))

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
type Served = Buffer | ((req: http.IncomingMessage, res: http.ServerResponse) => void)
// a Map, not an object: the request path picks the entry and must never reach anything but a registered one
let served: Map<string, Served> = new Map()
// 'GET /path [range]' for every request the server answered
let requests: string[] = []
// handlers the updater registered to run when the app quits
let quitHandlers: Array<(exitCode: number) => void> = []
// paths whose response is held back until the promise resolves, to overlap requests deliberately
let held: Record<string, Promise<void>> = {}

beforeAll(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-updater-sec-'))
  server = http.createServer(async (req, res) => {
    const requested = decodeURIComponent((req.url ?? '').split('?')[0])
    await held[requested]
    const body = served.get(requested)
    requests.push(`${req.method} ${requested}${req.headers.range ? ` ${req.headers.range}` : ''}`)
    if (!body) {
      res.writeHead(404).end()
      return
    }
    if (typeof body === 'function') {
      body(req, res)
      return
    }
    const range = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range ?? '')
    if (range) {
      const [from, to] = [Number(range[1]), Number(range[2])]
      res
        .writeHead(206, {
          'content-length': to - from + 1,
          'content-range': `bytes ${from}-${to}/${body.length}`,
        })
        .end(body.subarray(from, to + 1))
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
    onQuit: handler => {
      quitHandlers.push(handler)
    },
  }
}

// one range per request keeps the test server simple
const updateConfig = () => `provider: generic\nurl: ${feedUrl}\nuseMultipleRangeRequest: false\n`

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
const serveFeed = (
  feed: Buffer,
  files: Record<string, Buffer | ((req: http.IncomingMessage, res: http.ServerResponse) => void)>
) => {
  served = new Map<string, Served>([
    ['/latest.yml', feed],
    ['/latest-linux.yml', feed],
    ['/latest-mac.yml', feed],
    ...Object.entries(files),
  ])
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
  const hooks = () => ({
    executeDownload: jest.fn(),
    getOrCreateDownloadHelper: jest.fn(),
    install: jest.fn(),
    spawnLog: jest.fn(),
  })

  it('removes only stale verified install copies, by exact name, from the app-owned directory', () => {
    const baseCachePath = fs.mkdtempSync(path.join(workDir, 'cleanup-'))
    const parent = path.join(baseCachePath, 'quiet-verified-installers')
    fs.mkdirSync(parent)
    const outside = fs.mkdtempSync(path.join(workDir, 'outside-'))
    fs.writeFileSync(path.join(outside, 'precious'), 'x')
    const longAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const make = (name: string, old: boolean) => {
      const dir = path.join(parent, name)
      fs.mkdirSync(dir)
      fs.writeFileSync(path.join(dir, 'installer'), 'x')
      if (old) fs.utimesSync(dir, longAgo, longAgo)
      return dir
    }
    const stale = make('v-abc123', true)
    const recent = make('v-def456', false)
    const lookalike = make('v-backups', true) // not a name mkdtemp makes
    const unrelated = make('quiet-update-backup', true)
    const link = path.join(parent, 'v-link12')
    fs.symlinkSync(outside, link)
    fs.lutimesSync(link, longAgo, longAgo)
    const file = path.join(parent, 'v-file12')
    fs.writeFileSync(file, 'x')
    fs.utimesSync(file, longAgo, longAgo)

    hardenUpdater({ ...hooks(), app: { baseCachePath } } as unknown as AppUpdater, 'linux', {
      publicKeys: [releaseKey.publicKey],
    })
    expect(fs.existsSync(stale)).toBe(false)
    for (const kept of [recent, lookalike, unrelated, file]) expect(fs.existsSync(kept)).toBe(true)
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true) // never followed
    expect(fs.existsSync(path.join(outside, 'precious'))).toBe(true)
  })

  it('does not follow a symlinked app-owned parent, for cleanup or for the install copy', () => {
    const baseCachePath = fs.mkdtempSync(path.join(workDir, 'parentlink-'))
    const outside = fs.mkdtempSync(path.join(workDir, 'outside-'))
    const victim = path.join(outside, 'v-abc123')
    fs.mkdirSync(victim)
    fs.writeFileSync(path.join(victim, 'precious'), 'x')
    const longAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    fs.utimesSync(victim, longAgo, longAgo)
    // 'junction' is what Windows uses without privileges; on POSIX it is an ordinary directory symlink
    fs.symlinkSync(outside, path.join(baseCachePath, 'quiet-verified-installers'), 'junction')

    hardenUpdater({ ...hooks(), app: { baseCachePath } } as unknown as AppUpdater, 'linux', {
      publicKeys: [releaseKey.publicKey],
    })
    expect(fs.existsSync(path.join(victim, 'precious'))).toBe(true)
  })

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
  const signatureUrl = new URL(`http://feed.test/${name}.sig`)
  const verify = (
    fetchSignature: () => Promise<string>,
    keys = [releaseKey.publicKey],
    version: string | null = VERSION
  ) =>
    verifyUpdateSignature(
      { sha512: sha512(bytes), fileName: name, version: version ?? undefined, signatureUrl },
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
    ['a version with a newline', '99.0.0\nfile:evil', name, sha512(bytes)],
    ['a version that is not semver', 'latest', name, sha512(bytes)],
    ['a file name with a newline', VERSION, 'Quiet\nsha512:x.exe', sha512(bytes)],
    ['a missing sha512', VERSION, name, undefined],
    ['a sha512 with a newline', VERSION, name, `${sha512(bytes)}\nx`],
    ['a sha512 that is not 64 bytes', VERSION, name, crypto.createHash('sha256').update(bytes).digest('base64')],
  ])('rejects %s before verifying anything', async (_label, version, fileName, announced) => {
    const fetchSignature = jest.fn(async () => genuine())
    await expect(
      verifyUpdateSignature(
        { sha512: announced, fileName, version, signatureUrl },
        [releaseKey.publicKey],
        fetchSignature
      )
    ).resolves.toMatch(/malformed/)
    expect(fetchSignature).not.toHaveBeenCalled()
  })

  it('tolerates surrounding whitespace in the signature file', async () => {
    await expect(verify(async () => `\n  ${genuine().trim()} \r\n`)).resolves.toBeNull()
  })

  it('rejects a signature made for another version, file name or sha512', async () => {
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
        requests = []
        quitHandlers = []
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

      it('a genuine signature over the announced hash does not let other bytes through', async () => {
        const fetchSignature = jest.fn(async () => signedAs(name, genuine).toString())
        serve(Buffer.concat([genuine, Buffer.from('x')]), null, genuine)
        const updater = configure(create(makeAdapter(platform, updateConfig())))
        hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey], fetchSignature })
        await expect(download(updater)).rejects.toThrow(/sha512 checksum mismatch|size|signed sha512/i)
        expect(fetchSignature).toHaveBeenCalledTimes(1)
        expect(installerOf(updater)).toBeNull()
      })

      it('binds the downloaded bytes to the signed sha512 even if a download route skips its own hash check', async () => {
        // An executor that drops electron-updater's sha512 check, as a download route that does not
        // forward it would: the app's own re-hash of the finished file must still refuse the bytes.
        class UncheckedExecutor extends TestHttpExecutor {
          download(url: URL, destination: string, options: any): Promise<string> {
            return super.download(url, destination, { ...options, sha512: undefined, sha2: undefined })
          }
        }
        serve(Buffer.from('malicious payload '.repeat(500)), signedAs(name, genuine), genuine)
        const updater = configure(create(makeAdapter(platform, updateConfig())))
        ;(updater as unknown as { httpExecutor: TestHttpExecutor }).httpExecutor = new UncheckedExecutor()
        hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey] })
        await expect(download(updater)).rejects.toThrow(/does not match its signed sha512/)
        expect(installerOf(updater)).toBeNull()
      })

      describe('a bad signature is refused before the installer is downloaded', () => {
        const installerRequests = () =>
          requests.filter(r => r.startsWith(`GET /${name}`) && !r.startsWith(`GET /${name}.sig`))
        const signatureRequests = () => requests.filter(r => r === `GET /${name}.sig`)
        const malicious = Buffer.from('malicious payload '.repeat(500))

        it.each([
          ['missing', () => serve(genuine, null), /could not fetch the signature.*404/],
          ['malformed', () => serve(genuine, Buffer.from('<html>not a signature</html>')), /malformed/],
          ['from another key', () => serve(genuine, signedAs(name, genuine, VERSION, newKey())), /does not match/],
          ['replayed from an older version', () => serve(genuine, signedAs(name, genuine, '98.0.0')), /does not match/],
          [
            'for other bytes than the feed announces',
            () => serve(malicious, signedAs(name, genuine)),
            /does not match/,
          ],
        ])('%s: no installer byte is requested, on any check', async (_label, setUp, error) => {
          setUp()
          const updater = makeUpdater()
          // the periodic check runs again and again against the same bad feed
          for (let check = 0; check < 3; check++) {
            await expect(download(updater)).rejects.toThrow(error)
          }
          expect(signatureRequests()).toHaveLength(3)
          expect(installerRequests()).toEqual([])
          expect(installerOf(updater)).toBeNull()
        })

        it('the same feed with a good signature downloads the installer (control)', async () => {
          serve(genuine, signedAs(name, genuine))
          const updater = makeUpdater()
          await download(updater)
          expect(signatureRequests()).toHaveLength(1)
          expect(installerRequests()).toEqual([`GET /${name}`])
          // the signature is checked first
          expect(requests.indexOf(`GET /${name}.sig`)).toBeLessThan(requests.indexOf(`GET /${name}`))
        })
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
        for (const channel of ['/latest.yml', '/latest-linux.yml', '/latest-mac.yml']) {
          served.set(channel, Buffer.from(newerFeed))
        }
        expect((await updater.checkForUpdates())?.updateInfo.version).toBe('99.1.0')

        release()
        await expect(downloading).resolves.toHaveLength(1)
      })

      describe('install boundary', () => {
        // The updater installs whatever file its remembered path points to, so the file that was
        // verified must be what is run, on both routes: quitAndInstall() and install-on-quit.
        const prepare = async (autoInstall: boolean) => {
          serve(genuine, signedAs(name, genuine))
          const updater = makeUpdater()
          updater.autoInstallOnAppQuit = autoInstall
          // what the installer would be started from, captured at the moment it is called
          const installed: { path?: string; bytes?: Buffer; mode?: number; dirMode?: number } = {}
          const doInstall = jest.spyOn(updater as any, 'doInstall').mockImplementation(() => {
            installed.path = installerOf(updater) as string
            installed.bytes = fs.readFileSync(installed.path)
            installed.mode = fs.statSync(installed.path).mode & 0o777
            installed.dirMode = fs.statSync(path.dirname(installed.path)).mode & 0o777
            return false // not started: electron's autoUpdater is not loadable in a Node test
          })
          const errors: Error[] = []
          updater.on('error', error => errors.push(error))
          const [file] = await download(updater)
          return { updater, doInstall, errors, file, installed }
        }
        const replace = (file: string, bytes: Buffer) => {
          // the way a different process would: a new file under the same name
          fs.rmSync(file)
          fs.writeFileSync(file, bytes)
        }

        it('installs the verified file through quitAndInstall', async () => {
          const { updater, doInstall, errors, file, installed } = await prepare(false)
          updater.quitAndInstall(true)
          expect(doInstall).toHaveBeenCalledTimes(1)
          expect(errors).toEqual([])
          // installed from a verified private copy, never from the user-cache path it was downloaded to
          expect(installed.bytes).toEqual(genuine)
          expect(installed.path).not.toBe(file)
          expect(path.basename(installed.path as string)).toBe(path.basename(file))
          expect(installerOf(updater)).toBe(file)
          expect(installed.path).toMatch(/quiet-verified-installers[\\/]v-[A-Za-z0-9]{6}[\\/]/)
          if (process.platform !== 'win32') expect(installed.dirMode).toBe(0o700)
        })

        it('installs the verified file when the app quits', async () => {
          const { doInstall, errors, file, installed } = await prepare(true)
          expect(quitHandlers).toHaveLength(1)
          quitHandlers[0](0)
          expect(doInstall).toHaveBeenCalledTimes(1)
          expect(errors).toEqual([])
          expect(installed.bytes).toEqual(genuine)
          expect(installed.path).not.toBe(file)
        })

        it.each([
          ['replaced with other bytes of the same length', (g: Buffer) => Buffer.alloc(g.length, 0x41)],
          ['replaced with other bytes', () => Buffer.from('malicious payload')],
          ['truncated', (g: Buffer) => g.subarray(0, g.length - 1)],
        ])('refuses quitAndInstall when the downloaded file was %s after verification', async (_what, tamper) => {
          const { updater, doInstall, errors, file } = await prepare(false)
          replace(file, tamper(genuine))
          updater.quitAndInstall(true)
          expect(doInstall).not.toHaveBeenCalled()
          expect(errors.map(e => e.message).join()).toMatch(/changed after it was verified/)
          expect(fs.existsSync(file)).toBe(false)
        })

        it('refuses install-on-quit when the downloaded file was changed after verification', async () => {
          const { doInstall, errors, file } = await prepare(true)
          replace(file, Buffer.from('malicious payload'))
          quitHandlers[0](0)
          expect(doInstall).not.toHaveBeenCalled()
          expect(errors.map(e => e.message).join()).toMatch(/changed after it was verified/)
        })

        it('refuses an update that asks for administrator rights, and never starts the installer', async () => {
          // Quiet installs per user, so elevation is never legitimate; a feed that asks for it is refused
          serveFeed(
            Buffer.from(feedFile(name, genuine).replace(/(    size: \d+\n)/, '$1    isAdminRightsRequired: true\n')),
            {
              [`/${name}`]: genuine,
              [`/${name}.sig`]: signedAs(name, genuine),
            }
          )
          const updater = makeUpdater()
          updater.autoInstallOnAppQuit = true
          const doInstall = jest.spyOn(updater as any, 'doInstall').mockReturnValue(false)
          const errors: Error[] = []
          updater.on('error', error => errors.push(error))
          await download(updater)
          updater.quitAndInstall(true)
          quitHandlers[0](0)
          expect(doInstall).not.toHaveBeenCalled()
          expect(errors.map(e => e.message).join()).toMatch(/administrator rights/)
        })

        it('refuses to install through a symlinked or junctioned app-owned copies directory', async () => {
          const { updater, doInstall, errors, file } = await prepare(false)
          const base = (updater as any).app.baseCachePath as string
          const outside = fs.mkdtempSync(path.join(workDir, 'redirect-'))
          const parent = path.join(base, 'quiet-verified-installers')
          fs.rmSync(parent, { recursive: true, force: true })
          fs.symlinkSync(outside, parent, 'junction')
          updater.quitAndInstall(true)
          expect(doInstall).not.toHaveBeenCalled()
          expect(errors.map(e => e.message).join()).toMatch(/could not be checked/)
          expect(fs.readdirSync(outside)).toEqual([])
        })

        it('refuses to install a file that was overwritten in place', async () => {
          const { updater, doInstall, file } = await prepare(false)
          fs.appendFileSync(file, 'x')
          updater.quitAndInstall(true)
          expect(doInstall).not.toHaveBeenCalled()
        })

        it('refuses to install when the file has disappeared', async () => {
          const { updater, doInstall, errors, file } = await prepare(false)
          fs.rmSync(file)
          updater.quitAndInstall(true)
          expect(doInstall).not.toHaveBeenCalled()
          expect(errors).toHaveLength(1)
        })
      })

      describe('differential downloads', () => {
        const BLOCK = 2048
        const blockMapJson = (data: Buffer) => {
          const checksums: string[] = []
          const sizes: number[] = []
          for (let offset = 0; offset < data.length; offset += BLOCK) {
            const block = data.subarray(offset, offset + BLOCK)
            checksums.push(crypto.createHash('sha256').update(block).digest('base64'))
            sizes.push(block.length)
          }
          return JSON.stringify({ version: '2', files: [{ name: 'file', offset: 0, checksums, sizes }] })
        }
        // AppImages carry their block map at the end of the file (deflated, then its 4-byte length);
        // installers have a `<file>.blockmap` next to them.
        const embedded = platform === 'linux'
        const withBlockMap = (payload: Buffer) => {
          if (!embedded) return { file: payload, blockMapSize: undefined as number | undefined }
          const deflated = zlib.deflateRawSync(blockMapJson(payload))
          const length = Buffer.alloc(4)
          length.writeUInt32BE(deflated.length)
          return { file: Buffer.concat([payload, deflated, length]), blockMapSize: deflated.length }
        }
        // The installed app's file, which differs from the new one in a few blocks.
        const installedPayload = Buffer.concat([Buffer.alloc(BLOCK * 3, 0x42), genuine.subarray(BLOCK * 3)])
        const installed = withBlockMap(installedPayload).file
        const oldName = name.replace(VERSION, '1.0.0')

        // Where this updater looks for the file it is updating from.
        const prepareOldFile = (dir: string) => {
          const oldFile =
            platform === 'linux' ? (process.env.APPIMAGE as string) : path.join(dir, 'cache', 'Quiet', 'installer.exe')
          fs.mkdirSync(path.dirname(oldFile), { recursive: true })
          fs.writeFileSync(oldFile, installed)
        }

        // `payload` is what the feed's hash, the block map and the served ranges describe.
        const serveDifferential = (payload: Buffer, signedFile: Buffer | null) => {
          const { file, blockMapSize } = withBlockMap(payload)
          let feed = feedFile(name, file)
          if (blockMapSize != null)
            feed = feed.replace(
              `    size: ${file.length}\n`,
              `    size: ${file.length}\n    blockMapSize: ${blockMapSize}\n`
            )
          serveFeed(Buffer.from(feed), {
            [`/${name}`]: file,
            ...(embedded
              ? {}
              : {
                  [`/${name}.blockmap`]: zlib.gzipSync(blockMapJson(payload)),
                  [`/${oldName}.blockmap`]: zlib.gzipSync(blockMapJson(installedPayload)),
                }),
            ...(signedFile ? { [`/${name}.sig`]: signedAs(name, signedFile) } : {}),
          })
          return file
        }
        const differentialUpdater = () => {
          const dir = fs.mkdtempSync(path.join(workDir, `${platform}-diff-`))
          prepareOldFile(dir)
          const updater = makeUpdater(dir)
          updater.disableDifferentialDownload = false
          return updater
        }
        const usedRanges = () => requests.filter(r => r.startsWith(`GET /${name} bytes=`))

        it('accepts a genuine update assembled from the installed file and ranges of the new one (control)', async () => {
          const file = serveDifferential(genuine, withBlockMap(genuine).file)
          const updater = differentialUpdater()
          const [downloaded] = await download(updater)
          expect(fs.readFileSync(downloaded)).toEqual(file)
          expect(usedRanges().length).toBeGreaterThan(0)
          expect(requests).not.toContain(`GET /${name}`)
        })

        it('rejects tampered bytes delivered differentially with a block map and feed hash that match them', async () => {
          const malicious = Buffer.concat([
            Buffer.alloc(BLOCK * 3, 0x42),
            Buffer.from('malicious payload '.repeat(500)),
          ])
          serveDifferential(malicious, withBlockMap(genuine).file)
          const updater = differentialUpdater()
          await expect(download(updater)).rejects.toThrow(/not signed by the Quiet release key.*does not match/)
          // refused on the announcement: not a single range is fetched
          expect(usedRanges()).toEqual([])
          expect(installerOf(updater)).toBeNull()
        })

        it('rejects differentially delivered bytes that differ from the signed, announced file', async () => {
          // The feed announces the genuine file and carries its genuine signature, but the block map and the
          // served ranges describe other bytes of the same length.
          const tampered = Buffer.from(genuine)
          tampered.fill(0x6d, BLOCK * 4, BLOCK * 4 + 64)
          const announced = withBlockMap(genuine).file
          const { file, blockMapSize } = withBlockMap(tampered)
          // the signed statement binds the sha512, not the size: announce the size of what is served
          let feed = feedFile(name, file).split(sha512(file)).join(sha512(announced))
          if (blockMapSize != null)
            feed = feed.replace(
              `    size: ${file.length}\n`,
              `    size: ${file.length}\n    blockMapSize: ${blockMapSize}\n`
            )
          serveFeed(Buffer.from(feed), {
            [`/${name}`]: file,
            ...(embedded
              ? {}
              : {
                  [`/${name}.blockmap`]: zlib.gzipSync(blockMapJson(tampered)),
                  [`/${oldName}.blockmap`]: zlib.gzipSync(blockMapJson(installedPayload)),
                }),
            [`/${name}.sig`]: signedAs(name, announced),
          })
          const updater = differentialUpdater()
          await expect(download(updater)).rejects.toThrow(/sha512|checksum|size/i)
          expect(installerOf(updater)).toBeNull()
        })

        it('rejects a differential update with no signature file', async () => {
          serveDifferential(genuine, null)
          const updater = differentialUpdater()
          await expect(download(updater)).rejects.toThrow(/could not fetch the signature/)
          expect(installerOf(updater)).toBeNull()
        })
      })

      describe('signature size limit', () => {
        const oversized =
          (sendHead: (res: http.ServerResponse) => void, sent: { bytes: number }) =>
          (req: http.IncomingMessage, res: http.ServerResponse) => {
            sendHead(res)
            const chunk = Buffer.alloc(16 * 1024, 0x41)
            const timer = setInterval(() => {
              if (res.destroyed || sent.bytes > 8 * 1024 * 1024) {
                clearInterval(timer)
                res.destroy()
                return
              }
              sent.bytes += chunk.length
              res.write(chunk)
            }, 1)
            res.on('close', () => clearInterval(timer))
          }

        it('stops reading a chunked signature response at the limit instead of buffering it', async () => {
          const sent = { bytes: 0 }
          serveFeed(Buffer.from(feedFile(name, genuine)), {
            [`/${name}`]: genuine,
            [`/${name}.sig`]: oversized(res => res.writeHead(200), sent),
          })
          await expect(download(makeUpdater())).rejects.toThrow(/signature file is larger than 4096 bytes/)
          // the request is aborted soon after the limit, long before a large body could be buffered
          expect(sent.bytes).toBeLessThan(2 * 1024 * 1024)
        })

        it('refuses a signature whose declared length is over the limit without reading it', async () => {
          const sent = { bytes: 0 }
          serveFeed(Buffer.from(feedFile(name, genuine)), {
            [`/${name}`]: genuine,
            [`/${name}.sig`]: oversized(res => res.writeHead(200, { 'content-length': 500 * 1024 * 1024 }), sent),
          })
          await expect(download(makeUpdater())).rejects.toThrow(/signature file is larger than 4096 bytes/)
          expect(sent.bytes).toBeLessThan(2 * 1024 * 1024)
        })
      })

      describe('downgrades', () => {
        const updaterAt = (installed: string) => {
          const updater = configure(create(makeAdapter(platform, updateConfig(), undefined, installed)))
          hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey] })
          return updater
        }

        it('does not offer a genuinely signed older release to a newer install', async () => {
          serve(genuine, signedAs(name, genuine))
          const updater = updaterAt('100.0.0')
          const result = await updater.checkForUpdates()
          expect(result?.isUpdateAvailable).toBe(false)
          expect(installerOf(updater)).toBeNull()
        })

        it('does not re-offer the installed version', async () => {
          serve(genuine, signedAs(name, genuine))
          expect((await updaterAt(VERSION).checkForUpdates())?.isUpdateAvailable).toBe(false)
        })

        it('keeps downgrades off even if the feed asks for them', async () => {
          serve(genuine, signedAs(name, genuine))
          const updater = updaterAt('100.0.0')
          updater.allowDowngrade = true
          hardenUpdater(updater, platform, { publicKeys: [releaseKey.publicKey] })
          expect(updater.allowDowngrade).toBe(false)
          expect((await updater.checkForUpdates())?.isUpdateAvailable).toBe(false)
        })
      })

      it('rejects tampering on a plain-HTTP feed (the feed itself is not trusted, only the key is)', async () => {
        expect(feedUrl.startsWith('http://')).toBe(true)
        const malicious = Buffer.from('malicious payload '.repeat(500))
        serve(malicious, signedAs(name, genuine))
        await expect(download(makeUpdater())).rejects.toThrow(/does not match/)
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

  describe('Windows Authenticode check, when a publisher is configured', () => {
    // Quiet's packaged app-update.yml names no publisher today (the signing certificate has to be valid
    // for that to work), so electron-updater skips its Authenticode check. This shows the release-key
    // check composes with it, so pinning a publisher later only adds the second boundary.
    const name = 'Quiet-Setup-99.0.0.exe'
    const genuine = Buffer.from('genuine installer '.repeat(500))
    const withPublisher = (verdict: string | null) => {
      const adapter = makeAdapter('win32', `${updateConfig()}publisherName:\n  - CN=Quiet Test\n`)
      const updater = configure(new NsisUpdater(undefined, adapter))
      const verify = jest.fn().mockResolvedValue(verdict)
      ;(updater as any)._verifyUpdateCodeSignature = verify
      hardenUpdater(updater, 'win32', { publicKeys: [releaseKey.publicKey] })
      return { updater, verify }
    }

    beforeEach(() => {
      held = {}
      serveFeed(Buffer.from(feedFile(name, genuine)), {
        [`/${name}`]: genuine,
        [`/${name}.sig`]: signedAs(name, genuine),
      })
    })

    it('needs both the release-key signature and the Authenticode signature', async () => {
      const { updater, verify } = withPublisher(null)
      await expect(download(updater)).resolves.toHaveLength(1)
      expect(verify).toHaveBeenCalledWith(['CN=Quiet Test'], expect.stringContaining(name))
    })

    it('rejects a release-key-signed installer whose Authenticode signature is not valid', async () => {
      const { updater } = withPublisher('signature status is 1, not valid')
      await expect(download(updater)).rejects.toThrow(/not signed by the application owner/)
    })

    it('still rejects an Authenticode-valid installer without a release-key signature', async () => {
      serveFeed(Buffer.from(feedFile(name, genuine)), { [`/${name}`]: genuine })
      const { updater } = withPublisher(null)
      await expect(download(updater)).rejects.toThrow(/could not fetch the signature/)
    })
  })

  it('fails closed when electron-updater has no install hook', () => {
    const updater = { executeDownload: jest.fn(), getOrCreateDownloadHelper: jest.fn() }
    expect(() =>
      hardenUpdater(updater as unknown as AppUpdater, 'linux', { publicKeys: [releaseKey.publicKey] })
    ).toThrow(/download hooks/)
  })

  describe('Windows installer start', () => {
    const name = 'Quiet-Setup-99.0.0.exe'
    const genuine = Buffer.from('genuine installer '.repeat(500))
    const harden = (spawn: jest.Mock) => {
      const updater = configure(new NsisUpdater(undefined, makeAdapter('win32', updateConfig())))
      ;(updater as any).spawnLog = spawn
      updater.autoInstallOnAppQuit = false
      hardenUpdater(updater, 'win32', { publicKeys: [releaseKey.publicKey] })
      return updater
    }

    beforeEach(() => {
      held = {}
      serveFeed(Buffer.from(feedFile(name, genuine)), {
        [`/${name}`]: genuine,
        [`/${name}.sig`]: signedAs(name, genuine),
      })
    })

    it('never runs elevate.exe, and passes other commands through', async () => {
      const spawn = jest.fn().mockResolvedValue('started')
      const updater = harden(spawn)
      await expect(
        (updater as any).spawnLog('C:\\Program Files\\Quiet\\resources\\elevate.exe', ['setup.exe'])
      ).rejects.toThrow(/Refusing to run the update installer elevated/)
      await expect((updater as any).spawnLog('/tmp/ELEVATE.EXE', [])).rejects.toThrow(/elevated/)
      expect(spawn).not.toHaveBeenCalled()
      await expect((updater as any).spawnLog('C:\\x\\setup.exe', ['--updated'])).resolves.toBe('started')
      expect(spawn).toHaveBeenCalledTimes(1)
    })

    it('does not fall back to elevate.exe when starting the installer fails', async () => {
      const resourcesPath = (process as any).resourcesPath
      ;(process as any).resourcesPath = 'C:\\Quiet\\resources'
      try {
        const spawn = jest.fn().mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }))
        const updater = harden(spawn)
        const errors: Error[] = []
        updater.on('error', error => errors.push(error))
        await download(updater)
        // the real NsisUpdater.doInstall: direct start fails with EACCES, which would retry through elevate.exe
        expect((updater as any).install(true, false)).toBe(true)
        await new Promise(resolve => setTimeout(resolve, 50))
        const started = spawn.mock.calls.map(call => String(call[0]))
        expect(started).toHaveLength(1)
        expect(started[0]).toMatch(/quiet-verified-installers/)
        expect(started.some(command => /elevate\.exe$/i.test(command))).toBe(false)
        expect(errors.map(e => e.message).join()).toMatch(/Cannot start the update installer/)
      } finally {
        ;(process as any).resourcesPath = resourcesPath
      }
    })

    it.each(['ENOENT', 'EACCES', 'UNKNOWN', 'EPERM'])(
      'a failure to start the installer (%s) is final: neither elevate.exe nor shell.openPath is reached',
      async code => {
        const resourcesPath = (process as any).resourcesPath
        ;(process as any).resourcesPath = 'C:\\Quiet\\resources'
        mockOpenPath.mockReset().mockResolvedValue('')
        try {
          const spawn = jest.fn().mockRejectedValue(Object.assign(new Error(code), { code }))
          const updater = harden(spawn)
          const errors: Error[] = []
          updater.on('error', error => errors.push(error))
          await download(updater)
          expect((updater as any).install(true, false)).toBe(true)
          await new Promise(resolve => setTimeout(resolve, 50))
          expect(spawn).toHaveBeenCalledTimes(1)
          expect(String(spawn.mock.calls[0][0])).not.toMatch(/elevate\.exe$/i)
          expect(mockOpenPath).not.toHaveBeenCalled()
          expect(errors.map(e => e.message).join()).toMatch(/Cannot start the update installer/)
        } finally {
          ;(process as any).resourcesPath = resourcesPath
        }
      }
    )
  })
})
