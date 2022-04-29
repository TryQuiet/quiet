import { checkForUpdate, createWindow, applyDevTools } from './main'
import { BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'

const mockShow = jest.fn()

jest.mock('@electron/remote/main', () => {
  return {
    initialize: jest.fn(),
    enable: jest.fn()
  }
})

jest.mock('electron-localshortcut', () => {
  return {
    register: jest.fn()
  }
})

jest.mock('./waggleHelpers', async () => ({
  getPorts: async () => {
    return {
      dataPort: jest.fn()
    }
  }
}))

jest.mock('electron', () => {
  return {
    app: {
      getPath: jest.fn(),
      getName: jest.fn(),
      getVersion: jest.fn(),
      requestSingleInstanceLock: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      setAsDefaultProtocolClient: jest.fn()
    },
    BrowserWindow: jest.fn().mockImplementation(() => {
      return {
        loadURL: jest.fn(),
        show: mockShow,
        setMinimumSize: jest.fn(),
        on: jest.fn()
      }
    })
  }
})

jest.mock('electron-updater', () => {
  return {
    autoUpdater: {
      checkForUpdates: jest.fn(),
      on: jest.fn()
    }
  }
})

describe('main electron process', () => {
  it('mian process creates two windows and show spalsh screen', async () => {
    await createWindow()

    //create 2 windows, splash screen and main window
    expect(BrowserWindow).toHaveBeenCalledTimes(2)

    //show spalsh screen
    expect(mockShow).toHaveBeenCalledTimes(1)
  })

  it('checkForUpdate', async () => {
    const window = new BrowserWindow()
    await checkForUpdate(window)

    //checking is autoUpdater strat
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    // checking autoUpdater life cycle
    const autoUpdaterOn = autoUpdater.on as jest.Mock<any, any>
    expect(autoUpdaterOn.mock.calls[0][0]).toBe('checking-for-update')
    expect(autoUpdaterOn.mock.calls[1][0]).toBe('error')
    expect(autoUpdaterOn.mock.calls[2][0]).toBe('update-not-available')
    expect(autoUpdaterOn.mock.calls[3][0]).toBe('update-available')
    expect(autoUpdaterOn.mock.calls[4][0]).toBe('update-downloaded')
  })

  // it('running dev tools', async () => {
  //   await applyDevTools()
  // })

  it('electron app have proper life cycle', async () => {
    const appOn = app.on as jest.Mock<any, any>
    expect(appOn.mock.calls[0][0]).toBe('open-url')
    expect(appOn.mock.calls[1][0]).toBe('ready')
    expect(appOn.mock.calls[2][0]).toBe('browser-window-created')
    expect(appOn.mock.calls[3][0]).toBe('window-all-closed')
    expect(appOn.mock.calls[4][0]).toBe('activate')
  })
})
