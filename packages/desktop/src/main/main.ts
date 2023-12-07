import './loadMainEnvs' // Needs to be at the top of imports
import { app, BrowserWindow, Menu, ipcMain, session, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import electronLocalshortcut from 'electron-localshortcut'
import url from 'url'
import { getPorts, ApplicationPorts, closeHangingBackendProcess } from './backendHelpers'
import pkijs, { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'
import logger from './logger'
import { fork, ChildProcess } from 'child_process'
import {
  DESKTOP_DATA_DIR,
  DESKTOP_DEV_DATA_DIR,
  argvInvitationCode,
  getFilesData,
  parseInvitationCodeDeepUrl,
} from '@quiet/common'
import { updateDesktopFile, processInvitationCode } from './invitation'
const ElectronStore = require('electron-store')

// eslint-disable-next-line
const remote = require('@electron/remote/main')
remote.initialize()

const log = logger('main')

let resetting = false

const updaterInterval = 15 * 60_000

export const isDev = process.env.NODE_ENV === 'development'
export const isE2Etest = process.env.E2E_TEST === 'true'

const webcrypto = new Crypto()

global.crypto = webcrypto

let dataDir = DESKTOP_DATA_DIR
let mainWindow: BrowserWindow | null
let splash: BrowserWindow | null
let invitationUrl: string | null

if (isDev || process.env.DATA_DIR) {
  dataDir = process.env.DATA_DIR || DESKTOP_DEV_DATA_DIR
}

const appDataPath = path.join(app.getPath('appData'), dataDir)

if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath)
  fs.mkdirSync(`${appDataPath}/Quiet`)
}

const newUserDataPath = path.join(appDataPath, 'Quiet')

app.setPath('appData', appDataPath)
app.setPath('userData', newUserDataPath)

// Initialize electron store after setting new 'appData'
ElectronStore.initRenderer()

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('This is second instance. Quitting')
  app.quit()
  app.exit()
} else {
  try {
    updateDesktopFile(isDev)
  } catch (e) {
    console.error(`Couldn't update desktop file: ${e.message}`)
  }

  app.on('second-instance', (_event, commandLine) => {
    console.log('Event: app.second-instance', commandLine)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      const invitationCode = argvInvitationCode(commandLine)
      processInvitationCode(mainWindow, invitationCode)
    }
  })
}

console.log('setAsDefaultProtocolClient', app.setAsDefaultProtocolClient('quiet'))

interface IWindowSize {
  width: number
  height: number
}

console.log('electron main')

const windowSize: IWindowSize = {
  width: 800,
  height: 540,
}

setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  })
)

const SOCKET_IO_SECRET = webcrypto.getRandomValues(new Uint32Array(5)).join('')

export const isBrowserWindow = (window: BrowserWindow | null): window is BrowserWindow => {
  return window instanceof BrowserWindow
}

const extensionsFolderPath = `${app.getPath('userData')}/extensions`

export const applyDevTools = async () => {
  /* eslint-disable */
  if (!isDev || isE2Etest) return
  /* eslint-disable */
  require('electron-debug')({
    showDevTools: true,
  })
  const installer = require('electron-devtools-installer')
  const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer')
  /* eslint-enable */
  const extensionsData = [
    {
      name: REACT_DEVELOPER_TOOLS,
      path: `${extensionsFolderPath}/${REACT_DEVELOPER_TOOLS.id}`,
    },
    {
      name: REDUX_DEVTOOLS,
      path: `${extensionsFolderPath}/${REDUX_DEVTOOLS.id}`,
    },
  ]
  await Promise.all(
    extensionsData.map(async extension => {
      await installer.default(extension.name)
    })
  )
  await Promise.all(
    extensionsData.map(async extension => {
      await session.defaultSession.loadExtension(extension.path, { allowFileAccess: true })
    })
  )
}

app.on('open-url', (event, url) => {
  // MacOS only
  console.log('app.open-url', url)
  invitationUrl = url // If user opens invitation link with closed app open-url fires too early - before mainWindow is initialized
  event.preventDefault()
  if (mainWindow) {
    invitationUrl = null
    try {
      const invitationCode = parseInvitationCodeDeepUrl(url)
      processInvitationCode(mainWindow, invitationCode)
    } catch (e) {
      console.warn(e.message)
    }
  }
})

let browserWidth: number
let browserHeight: number

// Default title bar must be hidden for macos because we have custom styles for it
const titleBarStyle = process.platform !== 'win32' ? 'hidden' : 'default'
export const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    show: false,
    titleBarStyle,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  })

  remote.enable(mainWindow.webContents)

  splash = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    show: false,
    titleBarStyle,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    alwaysOnTop: true,
  })

  remote.enable(splash.webContents)

  // eslint-disable-next-line
  splash.loadURL(`file://${__dirname}/splash.html`)
  splash.setAlwaysOnTop(false)
  splash.setMovable(true)
  splash.show()

  electronLocalshortcut.register(splash, 'F12', () => {
    if (isBrowserWindow(splash)) {
      splash.webContents.openDevTools()
    }
  })

  mainWindow.setMinimumSize(600, 400)
  /* eslint-disable */
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './index.html'),
      search: `dataPort=${ports.dataServer}&socketIOSecret=${SOCKET_IO_SECRET}`,
      protocol: 'file:',
      slashes: true,
      hash: '/',
    })
  )
  /* eslint-enable */
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    log('Event mainWindow.closed')
    mainWindow = null
  })
  mainWindow.on('resize', () => {
    if (isBrowserWindow(mainWindow)) {
      const [width, height] = mainWindow.getSize()
      browserHeight = height
      browserWidth = width
    }
  })
  electronLocalshortcut.register(mainWindow, 'CommandOrControl+L', () => {
    if (isBrowserWindow(mainWindow)) {
      mainWindow.webContents.send('openLogs')
    }
  })
  electronLocalshortcut.register(mainWindow, 'F12', () => {
    if (isBrowserWindow(mainWindow)) {
      mainWindow.webContents.openDevTools()
    }
  })

  electronLocalshortcut.register(mainWindow, 'CommandOrControl+=', () => {
    const currentFactor = mainWindow?.webContents.getZoomFactor() || 1
    if (!mainWindow || currentFactor > 3.5) return
    mainWindow.webContents.zoomFactor = currentFactor + 0.2
  })

  electronLocalshortcut.register(mainWindow, 'CommandOrControl+-', () => {
    const currentFactor = mainWindow?.webContents.getZoomFactor() || 1
    if (!mainWindow || currentFactor <= 0.25) return
    mainWindow.webContents.zoomFactor = currentFactor - 0.2
  })
  log('Created mainWindow')
}

const isNetworkError = (errorObject: { message: string }) => {
  return (
    errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
    errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
    errorObject.message === 'net::ERR_CONNECTION_RESET' ||
    errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
    errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
    errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT'
  )
}

export const checkForUpdate = async (win: BrowserWindow) => {
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    if (isNetworkError(error)) {
      log.error('Network Error')
    } else {
      log.error('Unknown Error')
      log.error(error == null ? 'unknown' : (error.stack || error).toString())
    }
  }
  autoUpdater.on('checking-for-update', () => {
    log('checking for updates...')
  })
  autoUpdater.on('error', error => {
    log('UPDATER ERROR: ', error)
  })
  autoUpdater.on('update-not-available', () => {
    log('event no update')
  })
  autoUpdater.on('update-available', info => {
    log(info)
  })
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('newUpdateAvailable')
  })
}

let ports: ApplicationPorts
let backendProcess: ChildProcess | null = null

const closeBackendProcess = () => {
  if (backendProcess !== null) {
    /* OrbitDB released a patch (0.28.5) that omits error thrown when closing the app during heavy replication
       it needs mending though as replication is not being stopped due to pednign ipfs block/dag calls.
       https://github.com/orbitdb/orbit-db-store/issues/121
       ...
       Quiet side workaround is force-killing backend process.
       It may result in problems caused by post-process leftovers (like lock-files),
       nevertheless developer team is aware of that and has a response
       https://github.com/TryQuiet/monorepo/issues/469
    */
    const forceClose = setTimeout(() => {
      const killed = backendProcess?.kill()
      log(`Backend killed: ${killed}, Quitting.`)
      app.quit()
    }, 2000)
    backendProcess.send('close')
    backendProcess.on('message', message => {
      if (message === 'closed-services') {
        log('Closing the app')
        clearTimeout(forceClose)
        app.quit()
      }
    })
  } else {
    app.quit()
  }
}

app.on('ready', async () => {
  log('Event: app.ready')
  Menu.setApplicationMenu(null)

  await applyDevTools()

  ports = await getPorts()
  await createWindow()

  mainWindow?.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('socketIOSecret', SOCKET_IO_SECRET)
    if (splash && !splash.isDestroyed()) {
      const [width, height] = splash.getSize()
      mainWindow?.setSize(width, height)

      const [splashWindowX, splashWindowY] = splash.getPosition()
      mainWindow?.setPosition(splashWindowX, splashWindowY)

      splash.destroy()
      mainWindow?.show()
    }

    const temporaryFilesDirectory = path.join(appDataPath, 'temporaryFiles')
    fs.mkdirSync(temporaryFilesDirectory, { recursive: true })
    fs.readdir(temporaryFilesDirectory, (err, files) => {
      if (err) throw err
      for (const file of files) {
        fs.unlink(path.join(temporaryFilesDirectory, file), err => {
          if (err) throw err
        })
      }
    })
  })

  const forkArgvs = [
    '-d',
    `${ports.dataServer}`,
    '-a',
    `${appDataPath}`,
    '-r',
    `${process.resourcesPath}`,
    '-p',
    'desktop',
    '-scrt',
    `${SOCKET_IO_SECRET}`,
  ]

  const backendBundlePath = path.normalize(require.resolve('backend-bundle'))
  try {
    closeHangingBackendProcess(path.normalize(path.join('backend-bundle', 'bundle.cjs')), path.normalize(appDataPath))
  } catch (e) {
    console.error('Error occurred while trying to close hanging backend process', e.message)
  }

  backendProcess = fork(backendBundlePath, forkArgvs)
  log('Forked backend, PID:', backendProcess.pid)

  backendProcess.on('error', e => {
    log.error('Backend process returned error', e)
    throw Error(e.message)
  })

  backendProcess.on('exit', code => {
    if (code === 1) {
      throw Error('Abnormal backend process termination')
    }
  })

  if (!isBrowserWindow(mainWindow)) {
    throw new Error(`mainWindow is on unexpected type ${mainWindow}`)
  }

  mainWindow.webContents.on('did-fail-load', () => {
    log('failed loading webcontents')
  })

  mainWindow.once('close', e => {
    if (resetting) return
    e.preventDefault()
    log('Closing window')
    mainWindow?.webContents.send('force-save-state')
  })

  splash?.once('close', e => {
    e.preventDefault()
    log('Closing window')
    mainWindow?.webContents.send('force-save-state')
    closeBackendProcess()
  })

  ipcMain.on('state-saved', e => {
    mainWindow?.close()
    log('Saved state, closed window')
  })

  ipcMain.on('clear-community', () => {
    resetting = true
    backendProcess?.on('message', msg => {
      if (msg === 'leftCommunity') {
        resetting = false
      }
    })
    backendProcess?.send('leaveCommunity')
  })

  ipcMain.on('restartApp', () => {
    app.relaunch()
    closeBackendProcess()
  })

  ipcMain.on('writeTempFile', (event, arg) => {
    const temporaryFilesDirectory = path.join(appDataPath, 'temporaryFiles')
    fs.mkdirSync(temporaryFilesDirectory, { recursive: true })
    const filePath = `${path.join(temporaryFilesDirectory, arg.fileName)}`
    fs.writeFileSync(filePath, arg.fileBuffer)

    event.reply('writeTempFileReply', {
      path: filePath,
      id: arg.fileName.split(arg.ext)[0],
      ext: arg.ext,
    })
  })

  ipcMain.on('openUploadFileDialog', async e => {
    let filesDialogResult: Electron.OpenDialogReturnValue
    if (!mainWindow) {
      console.error('openUploadFileDialog - no mainWindow')
      return
    }
    try {
      filesDialogResult = await dialog.showOpenDialog(mainWindow, {
        title: 'Upload files to Quiet',
        properties: ['openFile', 'openFile', 'multiSelections'],
        filters: [],
      })
    } catch (e) {
      mainWindow?.webContents.send('openedFilesError', e)
      return
    }

    if (filesDialogResult.filePaths) {
      mainWindow?.webContents.send(
        'openedFiles',
        getFilesData(
          filesDialogResult.filePaths.map(filePath => {
            return { path: filePath }
          })
        )
      )
    }
  })

  mainWindow.webContents.once('did-finish-load', async () => {
    log('Event: mainWindow did-finish-load')
    if (!isBrowserWindow(mainWindow)) {
      throw new Error(`mainWindow is on unexpected type ${mainWindow}`)
    }
    if (process.platform === 'darwin' && invitationUrl) {
      try {
        const invitationCode = parseInvitationCodeDeepUrl(invitationUrl)
        processInvitationCode(mainWindow, invitationCode)
      } catch (e) {
        console.warn(e.message)
      } finally {
        invitationUrl = null
      }
    }
    if (process.platform !== 'darwin' && process.argv) {
      try {
        const invitationCode = argvInvitationCode(process.argv)
        processInvitationCode(mainWindow, invitationCode)
      } catch (e) {
        console.warn(e.message)
      }
    }

    await checkForUpdate(mainWindow)
    setInterval(async () => {
      if (!isBrowserWindow(mainWindow)) {
        throw new Error(`mainWindow is on unexpected type ${mainWindow}`)
      }
      await checkForUpdate(mainWindow)
    }, updaterInterval)
  })

  ipcMain.on('proceed-update', () => {
    autoUpdater.quitAndInstall()
  })
})

app.on('browser-window-created', (_, window) => {
  log('Event: app.browser-window-created', window.getTitle())
  remote.enable(window.webContents)
})

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
  log('Event: app.window-all-closed')
  closeBackendProcess()
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // NOTE: temporarly quit macos when using 'X'. Reloading the app loses the connection with backend. To be fixed.
})

app.on('activate', async () => {
  log('Event: app.activate')
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    await createWindow()
  }
})
