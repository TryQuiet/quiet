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
import { hardenUpdater, WINDOWS_PUBLISHER_NAMES } from './updaterSecurity'

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

const sha512 = (data: Buffer) => crypto.createHash('sha512').update(data).digest('base64')

const VERSION = '99.0.0'

let workDir: string
let server: http.Server
let feedUrl: string
// path -> body; swapped per test to model a feed that was tampered with
let served: Record<string, Buffer>

beforeAll(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-updater-sec-'))
  server = http.createServer((req, res) => {
    const body = served[decodeURIComponent((req.url ?? '').split('?')[0])]
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

const makeAdapter = (name: string, updateConfig: string): AppAdapter => {
  const dir = fs.mkdtempSync(path.join(workDir, `${name}-`))
  const appUpdateConfigPath = path.join(dir, 'app-update.yml')
  fs.writeFileSync(appUpdateConfigPath, updateConfig)
  return {
    version: '1.0.0',
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

// What electron-builder writes into resources/app-update.yml today (no publisherName) and with it.
const configWithoutPublisher = () => `provider: generic\nurl: ${feedUrl}\n`
const configWithPublisher = () => `${configWithoutPublisher()}publisherName:\n  - CN=Attacker Ltd\n`

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
  it('refuses downgrades and web installers on every platform', () => {
    for (const platform of ['linux', 'darwin', 'win32'] as const) {
      const updater = {
        allowDowngrade: true,
        disableWebInstaller: false,
        verifySignature: jest.fn(),
        verifyUpdateCodeSignature: jest.fn(),
      }
      hardenUpdater(updater as unknown as AppUpdater, platform)
      expect(updater.allowDowngrade).toBe(false)
      expect(updater.disableWebInstaller).toBe(true)
    }
  })

  it('leaves signature verification alone off Windows', () => {
    const verifySignature = jest.fn()
    const updater = { verifySignature, verifyUpdateCodeSignature: jest.fn() }
    hardenUpdater(updater as unknown as AppUpdater, 'linux')
    expect(updater.verifySignature).toBe(verifySignature)
  })

  it('pins a full-DN publisher that matches package.json', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { build } = require('../../package.json')
    expect(build.win.signtoolOptions.publisherName).toEqual([...WINDOWS_PUBLISHER_NAMES])
    expect(build.win.verifyUpdateCodeSignature).toBe(true)
    for (const name of WINDOWS_PUBLISHER_NAMES) {
      expect(name).toMatch(/CN=.+, O=.+, C=\w\w/)
    }
  })

  it('fails closed on Windows when electron-updater no longer exposes its signature hooks', () => {
    expect(() => hardenUpdater({} as unknown as AppUpdater, 'win32')).toThrow(/signature hooks/)
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

  describe('Linux (AppImage): sha512 from the feed is enforced', () => {
    const name = 'Quiet-99.0.0.AppImage'
    const genuine = Buffer.from('genuine AppImage bytes '.repeat(500))

    const appImageUpdater = () => {
      const updater = configure(new AppImageUpdater(undefined, makeAdapter('linux', configWithoutPublisher())))
      hardenUpdater(updater, 'linux')
      return updater
    }

    it('accepts an AppImage whose bytes match the feed hash (control)', async () => {
      served = { '/latest-linux.yml': Buffer.from(feedFile(name, genuine)), [`/${name}`]: genuine }
      const downloaded = await download(appImageUpdater())
      expect(fs.readFileSync(downloaded[0])).toEqual(genuine)
    })

    it('rejects an AppImage swapped for different bytes behind the same feed entry', async () => {
      const malicious = Buffer.from('malicious payload '.repeat(500))
      served = { '/latest-linux.yml': Buffer.from(feedFile(name, genuine)), [`/${name}`]: malicious }
      await expect(download(appImageUpdater())).rejects.toThrow(/sha512 checksum mismatch/)
    })

    it('rejects a feed entry that carries no hash at all', async () => {
      const noHash = `version: ${VERSION}\nfiles:\n  - url: ${name}\npath: ${name}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`
      served = { '/latest-linux.yml': Buffer.from(noHash), [`/${name}`]: genuine }
      await expect(download(appImageUpdater())).rejects.toThrow(/sha512/)
    })
  })

  describe('Windows (NSIS): signature is checked against the pinned publisher', () => {
    const name = 'Quiet-Setup-99.0.0.exe'
    const installer = Buffer.from('MZ pretend installer '.repeat(500))

    // Get-AuthenticodeSignature only exists on Windows, so stand in for it: valid only for a
    // payload marked "signed-by:<dn>" and only when that DN is one of the names handed over.
    const fakeAuthenticode = jest.fn(async (publisherNames: string[], file: string) => {
      const marker = /signed-by:(.+)$/m.exec(fs.readFileSync(file, 'latin1'))
      return marker && publisherNames.includes(marker[1]) ? null : `not signed by ${publisherNames.join(' | ')}`
    })

    const nsisUpdater = (config: string) => {
      const updater = configure(new NsisUpdater(undefined, makeAdapter('win', config)))
      ;(updater as unknown as { verifyUpdateCodeSignature: typeof fakeAuthenticode }).verifyUpdateCodeSignature =
        fakeAuthenticode
      hardenUpdater(updater, 'win32')
      return updater
    }

    // The updater asks for latest.yml, latest-mac.yml or latest-linux.yml depending on the host
    // running the test, whatever installer type it is exercising.
    const serve = (payload: Buffer, declared = payload) => {
      const feed = Buffer.from(feedFile(name, declared))
      served = { '/latest.yml': feed, '/latest-linux.yml': feed, '/latest-mac.yml': feed, [`/${name}`]: payload }
    }

    beforeEach(() => fakeAuthenticode.mockClear())

    it('installs an installer signed by the pinned publisher (control)', async () => {
      serve(Buffer.concat([installer, Buffer.from(`\nsigned-by:${WINDOWS_PUBLISHER_NAMES[0]}`)]))
      await expect(download(nsisUpdater(configWithoutPublisher()))).resolves.toHaveLength(1)
      expect(fakeAuthenticode).toHaveBeenCalledWith([...WINDOWS_PUBLISHER_NAMES], expect.stringContaining('.exe'))
    })

    it('rejects a validly hashed installer signed by someone else', async () => {
      serve(Buffer.concat([installer, Buffer.from('\nsigned-by:CN=Attacker Ltd')]))
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(
        /not signed by the application owner/
      )
    })

    it('rejects an unsigned installer even though app-update.yml has no publisherName', async () => {
      serve(installer)
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(
        /not signed by the application owner/
      )
    })

    it('ignores a publisherName planted in app-update.yml', async () => {
      serve(Buffer.concat([installer, Buffer.from('\nsigned-by:CN=Attacker Ltd')]))
      await expect(download(nsisUpdater(configWithPublisher()))).rejects.toThrow(/not signed by the application owner/)
      expect(fakeAuthenticode.mock.calls[0][0]).toEqual([...WINDOWS_PUBLISHER_NAMES])
    })

    it('still rejects a hash mismatch before any signature is considered', async () => {
      const signed = Buffer.concat([installer, Buffer.from(`\nsigned-by:${WINDOWS_PUBLISHER_NAMES[0]}`)])
      serve(Buffer.concat([signed, Buffer.from('x')]), signed)
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(/sha512 checksum mismatch|size/i)
      expect(fakeAuthenticode).not.toHaveBeenCalled()
    })

    it('without hardenUpdater the same unsigned installer is accepted (the old behaviour)', async () => {
      serve(installer)
      const updater = configure(new NsisUpdater(undefined, makeAdapter('win-old', configWithoutPublisher())))
      ;(updater as unknown as { verifyUpdateCodeSignature: typeof fakeAuthenticode }).verifyUpdateCodeSignature =
        fakeAuthenticode
      await expect(download(updater)).resolves.toHaveLength(1)
      expect(fakeAuthenticode).not.toHaveBeenCalled()
    })
  })
})
