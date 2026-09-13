import {
  applyFakeCameraSwitches,
  isAppPageUrl,
  registerCameraPermissionHandlers,
  resolveCameraAccess,
} from './cameraPermission'

jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
  systemPreferences: { askForMediaAccess: jest.fn(), getMediaAccessStatus: jest.fn() },
}))

jest.mock('./logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}))

const INDEX = '/opt/quiet/resources/app/dist/main/index.html'

describe('isAppPageUrl', () => {
  it('accepts the app page with its query and hash', () => {
    expect(isAppPageUrl(`file://${INDEX}?dataPort=1234#/`, INDEX)).toBe(true)
  })

  it.each([
    ['another file', 'file:///opt/quiet/resources/app/dist/main/captcha.html'],
    ['http', 'http://localhost:8080/index.html'],
    ['garbage', 'not a url'],
    ['missing', undefined],
  ])('rejects %s', (_label, url) => {
    expect(isAppPageUrl(url, INDEX)).toBe(false)
  })
})

describe('registerCameraPermissionHandlers', () => {
  const ownRenderer = {} as Electron.WebContents
  const otherRenderer = {} as Electron.WebContents
  const isAppRenderer = (webContents: Electron.WebContents | null, url: string | undefined) =>
    webContents === ownRenderer && url === 'file:///app/index.html'

  const session = () => {
    const ses = { setPermissionRequestHandler: jest.fn(), setPermissionCheckHandler: jest.fn() }
    registerCameraPermissionHandlers(ses as unknown as Electron.Session, isAppRenderer)
    return {
      request: (webContents: Electron.WebContents, permission: string, details: object) => {
        const callback = jest.fn()
        ses.setPermissionRequestHandler.mock.calls[0][0](webContents, permission, callback, details)
        return callback.mock.calls[0][0] as boolean
      },
      check: (webContents: Electron.WebContents, permission: string, details: object) =>
        ses.setPermissionCheckHandler.mock.calls[0][0](webContents, permission, 'file://', details) as boolean,
    }
  }

  it('grants the camera to the app renderer', () => {
    const { request, check } = session()
    expect(request(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaTypes: ['video'] })).toBe(true)
    expect(check(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaType: 'video' })).toBe(true)
  })

  it('denies the microphone, even alongside the camera', () => {
    const { request, check } = session()
    expect(request(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaTypes: ['audio'] })).toBe(
      false
    )
    expect(
      request(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaTypes: ['video', 'audio'] })
    ).toBe(false)
    expect(request(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaTypes: [] })).toBe(false)
    expect(check(ownRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaType: 'audio' })).toBe(false)
  })

  it('denies the camera to any other renderer or page', () => {
    const { request, check } = session()
    expect(request(otherRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaTypes: ['video'] })).toBe(
      false
    )
    expect(request(ownRenderer, 'media', { requestingUrl: 'https://example.com/', mediaTypes: ['video'] })).toBe(false)
    expect(check(otherRenderer, 'media', { requestingUrl: 'file:///app/index.html', mediaType: 'video' })).toBe(false)
  })

  it('keeps granting everything that is not media, as before the handler existed', () => {
    const { request, check } = session()
    expect(request(otherRenderer, 'notifications', { requestingUrl: 'https://example.com/' })).toBe(true)
    expect(check(otherRenderer, 'notifications', { requestingUrl: 'https://example.com/' })).toBe(true)
  })
})

describe('resolveCameraAccess', () => {
  const preferences = () => ({
    askForMediaAccess: jest.fn<Promise<boolean>, ['microphone' | 'camera']>(),
    getMediaAccessStatus: jest.fn<ReturnType<Electron.SystemPreferences['getMediaAccessStatus']>, [any]>(),
  })

  it('asks macOS and reports its answer', async () => {
    const prefs = preferences()
    prefs.askForMediaAccess.mockResolvedValue(true)
    expect(await resolveCameraAccess('darwin', prefs)).toEqual({ status: 'granted' })
    expect(prefs.askForMediaAccess).toHaveBeenCalledWith('camera')
    prefs.askForMediaAccess.mockResolvedValue(false)
    expect(await resolveCameraAccess('darwin', prefs)).toEqual({ status: 'denied' })
  })

  it('reads the Windows privacy setting without prompting', async () => {
    const prefs = preferences()
    prefs.getMediaAccessStatus.mockReturnValue('denied')
    expect(await resolveCameraAccess('win32', prefs)).toEqual({ status: 'denied' })
    prefs.getMediaAccessStatus.mockReturnValue('granted')
    expect(await resolveCameraAccess('win32', prefs)).toEqual({ status: 'granted' })
    expect(prefs.askForMediaAccess).not.toHaveBeenCalled()
  })

  it('leaves Linux to getUserMedia', async () => {
    const prefs = preferences()
    expect(await resolveCameraAccess('linux', prefs)).toEqual({ status: 'granted' })
    expect(prefs.askForMediaAccess).not.toHaveBeenCalled()
    expect(prefs.getMediaAccessStatus).not.toHaveBeenCalled()
  })
})

describe('applyFakeCameraSwitches', () => {
  const commandLine = () =>
    ({ appendSwitch: jest.fn() }) as unknown as Electron.App['commandLine'] & {
      appendSwitch: jest.Mock
    }

  it('feeds Chromium the clip in e2e runs', () => {
    const line = commandLine()
    expect(applyFakeCameraSwitches(line, { IS_E2E: 'true', E2E_FAKE_CAMERA_FILE: '/tmp/qr.y4m' })).toBe(true)
    expect(line.appendSwitch.mock.calls).toEqual([
      ['use-fake-device-for-media-stream'],
      ['use-fake-ui-for-media-stream'],
      ['use-file-for-fake-video-capture', '/tmp/qr.y4m'],
    ])
  })

  it.each([
    ['outside e2e', { E2E_FAKE_CAMERA_FILE: '/tmp/qr.y4m' }],
    ['without a clip', { IS_E2E: 'true' }],
  ])('does nothing %s', (_label, env) => {
    const line = commandLine()
    expect(applyFakeCameraSwitches(line, env)).toBe(false)
    expect(line.appendSwitch).not.toHaveBeenCalled()
  })
})
