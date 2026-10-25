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
import {
  hardenUpdater,
  verifyWindowsInstaller,
  VerifyWindowsInstaller,
  WINDOWS_PUBLISHER_NAMES,
} from './updaterSecurity'

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
    expect(() => hardenUpdater({} as unknown as AppUpdater, 'win32')).toThrow(/signature hook/)
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
      serveFeed(Buffer.from(feedFile(name, genuine)), { [`/${name}`]: genuine })
      const downloaded = await download(appImageUpdater())
      expect(fs.readFileSync(downloaded[0])).toEqual(genuine)
    })

    it('rejects an AppImage swapped for different bytes behind the same feed entry', async () => {
      const malicious = Buffer.from('malicious payload '.repeat(500))
      serveFeed(Buffer.from(feedFile(name, genuine)), { [`/${name}`]: malicious })
      await expect(download(appImageUpdater())).rejects.toThrow(/sha512 checksum mismatch/)
    })

    it('rejects a feed entry that carries no hash at all', async () => {
      const noHash = `version: ${VERSION}\nfiles:\n  - url: ${name}\npath: ${name}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`
      serveFeed(Buffer.from(noHash), { [`/${name}`]: genuine })
      await expect(download(appImageUpdater())).rejects.toThrow(/sha512/)
    })
  })

  describe('Windows (NSIS): signature is checked against the pinned publisher and version', () => {
    const name = 'Quiet-Setup-99.0.0.exe'
    const installer = Buffer.from('MZ pretend installer '.repeat(500))
    const pinned = WINDOWS_PUBLISHER_NAMES[0]

    // Get-AuthenticodeSignature only exists on Windows, so stand in for it: an installer says who
    // signed it and which version it is with "signed-by:<dn>" and "version:<v>" marker lines.
    const fakeAuthenticode = jest.fn<ReturnType<VerifyWindowsInstaller>, Parameters<VerifyWindowsInstaller>>(
      async (publisherNames, file, expectedVersion) => {
        const text = fs.readFileSync(file, 'latin1')
        const signer = /signed-by:(.+)$/m.exec(text)?.[1]
        const version = /version:(.+)$/m.exec(text)?.[1]
        if (!signer || !publisherNames.includes(signer)) return `not signed by ${publisherNames.join(' | ')}`
        return version === expectedVersion ? null : `installer is version ${version}`
      }
    )

    const nsisUpdater = (config: string, harden = true) => {
      const updater = configure(new NsisUpdater(undefined, makeAdapter('win', config)))
      if (harden) hardenUpdater(updater, 'win32', fakeAuthenticode)
      return updater
    }

    const stamped = (signer: string | null, version = VERSION) =>
      Buffer.concat([installer, Buffer.from(`\nversion:${version}${signer ? `\nsigned-by:${signer}` : ''}`)])

    const serve = (payload: Buffer, declared = payload) =>
      serveFeed(Buffer.from(feedFile(name, declared)), { [`/${name}`]: payload })

    beforeEach(() => fakeAuthenticode.mockClear())

    it('installs an installer signed by the pinned publisher at the announced version (control)', async () => {
      serve(stamped(pinned))
      await expect(download(nsisUpdater(configWithoutPublisher()))).resolves.toHaveLength(1)
      expect(fakeAuthenticode).toHaveBeenCalledWith(WINDOWS_PUBLISHER_NAMES, expect.stringContaining('.exe'), VERSION)
    })

    it('rejects a validly hashed installer signed by someone else', async () => {
      serve(stamped('CN=Attacker Ltd'))
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(
        /not signed by the application owner/
      )
    })

    it('rejects an unsigned installer even though app-update.yml has no publisherName', async () => {
      serve(stamped(null))
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(
        /not signed by the application owner/
      )
    })

    it('ignores a publisherName planted in app-update.yml', async () => {
      serve(stamped('CN=Attacker Ltd'))
      await expect(download(nsisUpdater(configWithPublisher()))).rejects.toThrow(/not signed by the application owner/)
      expect(fakeAuthenticode.mock.calls[0][0]).toEqual(WINDOWS_PUBLISHER_NAMES)
    })

    it('rejects an older, genuinely signed installer replayed under a newer announced version', async () => {
      serve(stamped(pinned, '11.2.0'))
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(
        /not signed by the application owner.*11\.2\.0/
      )
    })

    it('still rejects a hash mismatch before any signature is considered', async () => {
      const signed = stamped(pinned)
      serve(Buffer.concat([signed, Buffer.from('x')]), signed)
      await expect(download(nsisUpdater(configWithoutPublisher()))).rejects.toThrow(/sha512 checksum mismatch|size/i)
      expect(fakeAuthenticode).not.toHaveBeenCalled()
    })

    it('without hardenUpdater the same unsigned installer is accepted (the old behaviour)', async () => {
      serve(stamped(null))
      const updater = nsisUpdater(configWithoutPublisher(), false)
      // electron-updater's own verifier, here given no publisherName to check against.
      await expect(download(updater)).resolves.toHaveLength(1)
      expect(fakeAuthenticode).not.toHaveBeenCalled()
    })
  })
})

describe('verifyWindowsInstaller', () => {
  const pinned = WINDOWS_PUBLISHER_NAMES
  const file = 'C:\\cache\\Quiet Setup 99.0.0.exe'
  // Shape of Get-AuthenticodeSignature piped through ConvertTo-Json, as the script emits it.
  const verdict = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({
      Status: 0,
      Path: file,
      Subject: 'CN=Zbay LLC, O=Zbay LLC, L=Boston, S=Massachusetts, C=US',
      ProductVersion: '99.0.0',
      ...overrides,
    })
  const verify = (output: string | Error, version: string | null = '99.0.0') =>
    verifyWindowsInstaller(pinned, file, version ?? undefined, async () => {
      if (output instanceof Error) throw output
      return output
    })

  it('accepts a valid signature from the pinned publisher at the announced version', async () => {
    await expect(verify(verdict())).resolves.toBeNull()
  })

  it.each([
    ['an invalid signature', { Status: 2 }],
    ['an unsigned file', { Status: 1, Subject: null }],
    ['a different publisher with the same CN', { Subject: 'CN=Zbay LLC, O=Other Corp, C=US' }],
    ['a different publisher', { Subject: 'CN=Attacker Ltd, O=Attacker Ltd, C=US' }],
    ['a verdict for a different file', { Path: 'C:\\elsewhere\\other.exe' }],
    ['a signed older version', { ProductVersion: '11.2.0' }],
    ['a missing version', { ProductVersion: null }],
  ])('rejects %s', async (_label, overrides) => {
    await expect(verify(verdict(overrides))).resolves.toEqual(expect.any(String))
  })

  it('rejects when PowerShell cannot be run, instead of ignoring the check', async () => {
    await expect(verify(new Error('spawn powershell.exe EACCES'))).resolves.toMatch(/could not verify/)
  })

  it('rejects unparseable output', async () => {
    await expect(verify('not json')).resolves.toMatch(/could not verify/)
  })

  it('rejects when the announced version is unknown', async () => {
    await expect(verify(verdict(), null)).resolves.toMatch(/version is unknown/)
  })

  it('rejects when no publisher is pinned', async () => {
    await expect(verifyWindowsInstaller([], file, '99.0.0', async () => verdict())).resolves.toMatch(/no publisher/)
  })
})

// Real Authenticode needs PowerShell's Get-AuthenticodeSignature, so this only runs on a Windows CI
// runner. It drives the production verifier (real PowerShell, no stub) against a system binary.
const windowsOnly = process.platform === 'win32' ? describe : describe.skip
windowsOnly('verifyWindowsInstaller with the real Authenticode verifier (Windows only)', () => {
  const microsoft = ['CN=Microsoft Windows, O=Microsoft Corporation, C=US']
  const signedBinary = path.join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe'
  )

  it('rejects a validly signed binary from a publisher other than the pinned one', async () => {
    await expect(verifyWindowsInstaller(WINDOWS_PUBLISHER_NAMES, signedBinary, '1.0.0')).resolves.toMatch(
      /signed by CN=Microsoft/
    )
  })

  it('accepts the pinned publisher only at the version stamped into the file', async () => {
    const wrongVersion = await verifyWindowsInstaller(microsoft, signedBinary, '0.0.0')
    const stamped = /installer is version (.+), the feed announced/.exec(wrongVersion ?? '')?.[1]
    expect(stamped).toBeTruthy()
    await expect(verifyWindowsInstaller(microsoft, signedBinary, stamped)).resolves.toBeNull()
  })

  it('rejects an unsigned file', async () => {
    const unsigned = path.join(os.tmpdir(), `quiet-unsigned-${process.pid}.exe`)
    fs.writeFileSync(unsigned, 'MZ not signed')
    try {
      await expect(verifyWindowsInstaller(microsoft, unsigned, '1.0.0')).resolves.toEqual(expect.any(String))
    } finally {
      fs.rmSync(unsigned, { force: true })
    }
  })
})
