jest.mock('electron-context-menu', () => jest.fn()) // prevents context-menu from interfering with tests

import * as main from './main'
import * as backendHelpers from './backendHelpers'

import { autoUpdater } from 'electron-updater'
import { BrowserWindow, app, ipcMain, Menu } from 'electron'
import { waitFor } from '@testing-library/dom'
import path from 'path'
import { composeInvitationDeepUrl, getValidInvitationUrlTestData, validInvitationCodeTestData } from '@quiet/common'
import { InvitationData } from '@quiet/types'

// eslint-disable-next-line
const remote = require('@electron/remote/main')

const mockShowWindow = jest.fn()
const mockWindowWebContentsSend = jest.fn()
const mockwebContentsOn = jest.fn()
const mockwebContentsOnce = jest.fn()
const mockDestroyWindow = jest.fn()
const mockWindowOn = jest.fn()
const mockWindowOnce = jest.fn()
const mockWindowHide = jest.fn()
const mockWindowClose = jest.fn()
const mockSetMovable = jest.fn()
const mockSetAlwaysOnTop = jest.fn()
const mockIsDestroyed = jest.fn()
const mockIsMaximized = jest.fn()
const mockIsFullScreen = jest.fn()
const mockGetPrimaryDisplay = jest.fn()
const mockStoreGet = jest.fn()
const mockStoreSet = jest.fn()

const spyCreateWindow = jest.spyOn(main, 'createWindow')
const spyGetPorts = jest.spyOn(backendHelpers, 'getPorts')

jest.spyOn(main, 'isBrowserWindow').mockReturnValue(true)
jest.spyOn(path, 'join').mockReturnValue('path')

jest.mock('electron-store', () => {
  // main.ts uses electron-store both as a namespace (initRenderer) and as a
  // constructor (the persisted window size), so the mock has to be both.
  const ElectronStoreMock: any = jest.fn().mockImplementation(() => {
    return {
      get: mockStoreGet,
      set: mockStoreSet,
    }
  })
  ElectronStoreMock.initRenderer = jest.fn()
  return ElectronStoreMock
})

jest.mock('@electron/remote/main', () => {
  return {
    initialize: jest.fn(),
    enable: jest.fn(),
  }
})

jest.mock('electron-localshortcut', () => {
  return {
    register: jest.fn(),
  }
})

jest.mock('child_process', () => {
  return {
    ...jest.requireActual('child_process'),
    fork: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        once: jest.fn(),
        send: jest.fn(),
      }
    }),
  }
})

jest.mock('electron', () => {
  return {
    ...jest.requireActual('electron'),
    app: {
      getPath: jest.fn().mockImplementation(() => {
        return '.'
      }),
      setPath: jest.fn(),
      getName: jest.fn(),
      getVersion: jest.fn(),
      requestSingleInstanceLock: jest.fn().mockReturnValue(true),
      quit: jest.fn(),
      exit: jest.fn(),
      on: jest.fn(),
      setAsDefaultProtocolClient: jest.fn(),
    },
    BrowserWindow: jest.fn().mockImplementation(() => {
      return {
        loadURL: jest.fn(),
        show: mockShowWindow,
        setMinimumSize: jest.fn(),
        hide: mockWindowHide,
        close: mockWindowClose,
        on: mockWindowOn,
        once: mockWindowOnce,
        getTitle: jest.fn(),
        destroy: mockDestroyWindow,
        isDestroyed: jest.fn(),
        setAlwaysOnTop: mockSetAlwaysOnTop,
        setMovable: mockSetMovable,
        getSize: jest.fn().mockImplementation(() => [600, 800]),
        getPosition: jest.fn().mockImplementation(() => [600, 800]),
        setSize: jest.fn(),
        setPosition: jest.fn(),
        isMaximized: mockIsMaximized,
        isFullScreen: mockIsFullScreen,
        isMinimized: jest.fn(),
        restore: jest.fn(),
        focus: jest.fn(),
        webContents: {
          on: mockwebContentsOn,
          once: mockwebContentsOnce,
          send: mockWindowWebContentsSend,
          isDestroyed: mockIsDestroyed,
        },
      }
    }),
    Menu: {
      setApplicationMenu: jest.fn(),
    },
    screen: {
      // Wrapped so the mock fn is looked up lazily - jest.mock factories run
      // before the const declarations above are initialised.
      getPrimaryDisplay: () => mockGetPrimaryDisplay(),
    },
    ipcMain: {
      on: jest.fn(),
      once: jest.fn(),
      handle: jest.fn(),
      removeListener: jest.fn(),
    },
  }
})

jest.mock('electron-updater', () => {
  return {
    autoUpdater: {
      checkForUpdates: jest.fn(),
      on: jest.fn(),
    },
  }
})

jest.mock('backend-bundle', jest.fn())

const appOn = app.on as jest.Mock<any, any>
const setApplicationMenu = Menu.setApplicationMenu as jest.Mock<any, any>
const autoUpdaterOn = autoUpdater.on as jest.Mock<any, any>
const mockAppOnCalls = appOn.mock.calls
const mockIpcMainOn = ipcMain.on as jest.Mock<any, any>

describe('electron app ready event', () => {
  it('application will trigger ready event, next run listener function of ready event', async () => {
    expect(mockAppOnCalls[2][0]).toBe('ready')
    await mockAppOnCalls[2][1]()
  })

  it('application menu will set one time as null - remove menu bar', async () => {
    expect(setApplicationMenu).toHaveBeenCalledTimes(1)
    expect(setApplicationMenu).toHaveBeenCalledWith(null)
  })

  it('get ports logic will trigger and will return propper ports', async () => {
    expect(spyGetPorts).toHaveBeenCalledTimes(1)
    const getPortsResult = async (): Promise<any> => spyGetPorts.mock.results[0].value
    await waitFor(async () =>
      expect(Object.keys(await getPortsResult())).toEqual([
        'socksPort',
        'libp2pHiddenService',
        'controlPort',
        'httpTunnelPort',
        'dataServer',
      ])
    )
  })

  it('creates splash screen and main window, show splash screen', async () => {
    expect(spyCreateWindow).toHaveBeenCalledTimes(1)

    // create 2 windows, splash screen and main window
    expect(BrowserWindow).toHaveBeenCalledTimes(2)
    // show spalsh screen
    expect(mockShowWindow).toHaveBeenCalledTimes(1)

    expect(mockSetAlwaysOnTop).toHaveBeenCalledWith(false)
    expect(mockSetMovable).toHaveBeenCalledWith(true)
  })

  it('replacing splash screen with main window in webcontents did-finish-load window event', async () => {
    const mockwebContentsOnCalls = mockwebContentsOn.mock.calls
    expect(mockwebContentsOnCalls[0][0]).toBe('did-finish-load')
    mockShowWindow.mockClear()

    mockwebContentsOnCalls[0][1]()

    // expect the splash screen to be destroyed and the main window to appear
    expect(mockDestroyWindow).toHaveBeenCalledTimes(1)
    expect(mockShowWindow).toHaveBeenCalledTimes(1)
  })

  it('close application triggers correct shutdown flow', async () => {
    // Find the handler registered with BrowserWindow.on('close', …)
    const closeCall = mockWindowOn.mock.calls.find(call => call[0] === 'close')
    expect(closeCall).toBeDefined()

    const closeHandler = closeCall![1] as (e: any) => void
    const event = { preventDefault: jest.fn() }
    closeHandler(event)

    if (process.platform === 'darwin') {
      // On macOS we ask the renderer to save state
      expect(mockWindowWebContentsSend).toHaveBeenCalledWith('force-save-state')
    } else {
      // On other OSes we tell the backend to shut down first
      const { fork } = require('child_process')
      const backend = (fork as jest.Mock).mock.results[0].value
      expect(backend.send).toHaveBeenCalledWith('close')
    }

    // Ensure the state-saved IPC listener was registered
    expect((ipcMain.on as jest.Mock).mock.calls.some(call => call[0] === 'state-saved')).toBe(true)
  })

  it('checks for updates in webcontents once did-finish-load window event', async () => {
    const mockwebContentsOnceCalls = mockwebContentsOnce.mock.calls
    expect(mockwebContentsOnceCalls[0][0]).toBe('did-finish-load')

    await mockwebContentsOnceCalls[0][1]()

    // checking is autoUpdater strat
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    // checking autoUpdater events are triggered
    expect(autoUpdaterOn.mock.calls[0][0]).toBe('checking-for-update')
    expect(autoUpdaterOn.mock.calls[1][0]).toBe('error')
    expect(autoUpdaterOn.mock.calls[2][0]).toBe('update-not-available')
    expect(autoUpdaterOn.mock.calls[3][0]).toBe('update-available')

    // update-downloaded event will send contet about available update to renderer process
    expect(autoUpdaterOn.mock.calls[4][0]).toBe('update-downloaded')
    autoUpdaterOn.mock.calls[4][1]()
    expect(mockWindowWebContentsSend).toHaveBeenCalledWith('newUpdateAvailable')
  })
})
// --- EXTRA QUIT-FLOW TESTS ---
describe('additional quit flow scenarios', () => {
  const forkMock = require('child_process').fork as jest.Mock
  it('before-quit interception waits for backend to exit first', () => {
    const beforeQuitHandler = mockAppOnCalls.find(c => c[0] === 'before-quit')[1]
    const backend = forkMock.mock.results[0].value
    backend.send.mockClear()

    const evt = { preventDefault: jest.fn() }
    beforeQuitHandler(evt)

    expect(evt.preventDefault).toHaveBeenCalled()
    expect(backend.send).toHaveBeenCalledWith('close')
  })

  it('state-saved event hides or closes the window when backend is still running', () => {
    const stateSavedHandler = mockIpcMainOn.mock.calls.find(c => c[0] === 'state-saved')[1]
    mockWindowHide.mockClear()
    mockWindowClose.mockClear()

    // backendProcess is still alive → trigger state-saved
    stateSavedHandler()

    if (process.platform === 'darwin') {
      expect(mockWindowHide).toHaveBeenCalledTimes(1)
      expect(mockWindowClose).not.toHaveBeenCalled()
    } else {
      expect(mockWindowClose).toHaveBeenCalledTimes(1)
      expect(mockWindowHide).not.toHaveBeenCalled()
    }
  })

  it('backend close ⇒ force-save-state ⇒ state-saved ⇒ app.quit()', () => {
    const backend = forkMock.mock.results[0].value
    const closeCb = backend.on.mock.calls.find((c: any[]) => c[0] === 'close')[1]

    closeCb() // simulate backend dying

    expect(mockWindowWebContentsSend).toHaveBeenCalledWith('force-save-state')

    const stateSavedHandler = mockIpcMainOn.mock.calls.find(c => c[0] === 'state-saved')[1]
    ;(app.quit as jest.Mock).mockClear()
    stateSavedHandler() // renderer confirms saved

    expect(app.quit).toHaveBeenCalled()
  })
})

// to improve
describe('other electron app events ', () => {
  it('app events listeners triggering', async () => {
    expect(mockAppOnCalls[0][0]).toBe('second-instance')
    expect(mockAppOnCalls[1][0]).toBe('open-url')
    expect(mockAppOnCalls[2][0]).toBe('ready')
    // browser-window-created app event
    const window = new BrowserWindow()
    expect(mockAppOnCalls[3][0]).toBe('browser-window-created')
    mockAppOnCalls[3][1](null, window)
    expect(remote.enable).toHaveBeenCalled()

    // window-all-closed app event
    expect(mockAppOnCalls[4][0]).toBe('window-all-closed')
    mockAppOnCalls[4][1]()

    // activate app event
    expect(mockAppOnCalls[5][0]).toBe('activate')
    mockAppOnCalls[5][1]()
  })
})

describe('Invitation code', () => {
  let codes: InvitationData

  beforeEach(() => {
    codes = { ...getValidInvitationUrlTestData(validInvitationCodeTestData[0]).data }
  })

  it('handles invitation code on open-url event (on macos)', async () => {
    expect(mockAppOnCalls[2][0]).toBe('ready')
    await mockAppOnCalls[2][1]()

    expect(mockAppOnCalls[1][0]).toBe('open-url')
    const event = { preventDefault: () => {} }
    const deepUrl = composeInvitationDeepUrl(codes)
    mockAppOnCalls[1][1](event, deepUrl)
    expect(mockWindowWebContentsSend).toHaveBeenCalledWith('invitation', { code: deepUrl })
  })

  it('do not process invitation code on open-url event (on macos) if url is empty', async () => {
    expect(mockAppOnCalls[2][0]).toBe('ready')
    await mockAppOnCalls[2][1]()

    expect(mockAppOnCalls[1][0]).toBe('open-url')
    const event = { preventDefault: () => {} }
    mockAppOnCalls[1][1](event, '')
    expect(mockWindowWebContentsSend).not.toHaveBeenCalledWith('invitation', { code: '' })
  })

  it('process invitation code on second-instance event', async () => {
    await mockAppOnCalls[2][1]()
    const deepUrl = composeInvitationDeepUrl(codes)
    const commandLine = ['/tmp/.mount_Quiet-TVQc6s/quiet', deepUrl, 'something/else']
    expect(mockAppOnCalls[0][0]).toBe('second-instance')
    const event = { preventDefault: () => {} }
    mockAppOnCalls[0][1](event, commandLine)
    expect(mockWindowWebContentsSend).toHaveBeenCalledWith('invitation', { code: deepUrl })
  })
})

describe('security: socketIOSecret exposure', () => {
  it('does not leak socketIOSecret in renderer process URL (query string)', () => {
    // Find the call to mainWindow.loadURL and check the search param
    const BrowserWindowMock = BrowserWindow as unknown as jest.Mock
    const calls = BrowserWindowMock.mock.calls
    // The second BrowserWindow is the main window
    const mainWindowInstance = BrowserWindowMock.mock.results[0]?.value
    expect(mainWindowInstance).toBeDefined()
    const loadURL = mainWindowInstance.loadURL
    expect(loadURL).toBeDefined()
    // Find the call to loadURL and extract the URL
    const loadURLCalls = loadURL.mock.calls
    expect(loadURLCalls.length).toBeGreaterThan(0)
    const urlArg = loadURLCalls[0][0]
    // Should NOT contain socketIOSecret=...
    expect(urlArg).not.toMatch(/socketIOSecret=[a-f0-9]{64}/i)
  })

  it('does not leak socketIOSecret in backend process fork arguments', () => {
    // Check the arguments passed to fork
    const forkMock = require('child_process').fork
    const forkCalls = forkMock.mock.calls
    expect(forkCalls.length).toBeGreaterThan(0)
    // Should NOT find the call with -scrt
    const secretCall = forkCalls.find((call: (string | string[])[]) => call[1] && call[1].includes('-scrt'))
    expect(secretCall).toBeUndefined()
  })
})

describe('window size persistence', () => {
  const BrowserWindowMock = BrowserWindow as unknown as jest.Mock

  // createWindow() builds the main window first and the splash window second.
  const optionsOfLastWindows = () => {
    const calls = BrowserWindowMock.mock.calls
    return { mainWindow: calls[calls.length - 2][0], splash: calls[calls.length - 1][0] }
  }

  // 'resize' is registered on every createWindow() call, so take the latest one.
  const lastHandlerFor = (event: string) =>
    mockWindowOn.mock.calls.filter(call => call[0] === event).pop()![1] as (...args: any[]) => void

  // 'close' is registered once, during startup, not on every createWindow() call.
  // Capture it before the per-test mockClear() wipes the record of it.
  let onStartupClose: (e: any) => void

  beforeAll(() => {
    onStartupClose = mockWindowOn.mock.calls.find(call => call[0] === 'close')![1]
  })

  beforeEach(() => {
    BrowserWindowMock.mockClear()
    mockWindowOn.mockClear()
    mockStoreGet.mockReset()
    mockStoreSet.mockReset()
    mockIsMaximized.mockReturnValue(false)
    mockIsFullScreen.mockReturnValue(false)
    mockGetPrimaryDisplay.mockReturnValue({ workAreaSize: { width: 2560, height: 1440 } })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses the built-in default size when nothing has been persisted', async () => {
    mockStoreGet.mockReturnValue(undefined)

    await main.createWindow()

    expect(optionsOfLastWindows().mainWindow).toEqual(expect.objectContaining({ width: 800, height: 540 }))
  })

  it('restores a persisted size that fits on the current display', async () => {
    mockStoreGet.mockReturnValue({ width: 1200, height: 900 })

    await main.createWindow()

    const { mainWindow, splash } = optionsOfLastWindows()
    expect(mainWindow).toEqual(expect.objectContaining({ width: 1200, height: 900 }))
    // The splash window has always matched the main window, so it still does.
    expect(splash).toEqual(expect.objectContaining({ width: 1200, height: 900 }))
  })

  it('clamps a persisted size that no longer fits the display work area', async () => {
    mockGetPrimaryDisplay.mockReturnValue({ workAreaSize: { width: 1366, height: 768 } })
    mockStoreGet.mockReturnValue({ width: 3840, height: 2160 })

    await main.createWindow()

    expect(optionsOfLastWindows().mainWindow).toEqual(expect.objectContaining({ width: 1366, height: 768 }))
  })

  it('falls back to the default size when the persisted value is malformed', async () => {
    mockStoreGet.mockReturnValue({ width: 'wide', height: -1 })

    await main.createWindow()

    expect(optionsOfLastWindows().mainWindow).toEqual(expect.objectContaining({ width: 800, height: 540 }))
  })

  it('falls back to the default size when reading the store throws', async () => {
    mockStoreGet.mockImplementation(() => {
      throw new Error('corrupted window-state.json')
    })

    await main.createWindow()

    expect(optionsOfLastWindows().mainWindow).toEqual(expect.objectContaining({ width: 800, height: 540 }))
  })

  it('persists the new size once resizing settles', async () => {
    jest.useFakeTimers()
    await main.createWindow()
    const onResize = lastHandlerFor('resize')

    onResize()
    onResize()
    onResize()
    expect(mockStoreSet).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    // Debounced: a burst of resize events results in a single write.
    expect(mockStoreSet).toHaveBeenCalledTimes(1)
    expect(mockStoreSet).toHaveBeenCalledWith('windowSize', { width: 600, height: 800 })
  })

  it('does not persist the size of a maximised window', async () => {
    jest.useFakeTimers()
    await main.createWindow()
    mockIsMaximized.mockReturnValue(true)

    lastHandlerFor('resize')()
    jest.advanceTimersByTime(1000)

    expect(mockStoreSet).not.toHaveBeenCalled()
  })

  it('flushes a pending save when the window is closed', async () => {
    jest.useFakeTimers()
    await main.createWindow()

    lastHandlerFor('resize')()
    expect(mockStoreSet).not.toHaveBeenCalled()

    onStartupClose({ preventDefault: jest.fn() })

    expect(mockStoreSet).toHaveBeenCalledWith('windowSize', { width: 600, height: 800 })

    // …and the pending debounce was cancelled rather than firing a second write.
    mockStoreSet.mockClear()
    jest.advanceTimersByTime(1000)
    expect(mockStoreSet).not.toHaveBeenCalled()
  })
})
