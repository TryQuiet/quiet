import './loadMainEnvs' // Needs to be at the top of imports
import { app, BrowserWindow, BrowserView, Menu, ipcMain, session, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import electronLocalshortcut from 'electron-localshortcut'
import url from 'url'
import { getPorts, ApplicationPorts, closeHangingBackendProcess } from './backendHelpers'
import { setEngine, CryptoEngine } from 'pkijs'
import { createLogger } from './logger'
import { fork, ChildProcess } from 'child_process'
import { getFilesData } from '@quiet/common'
import { updateDesktopFile, processInvitationCode } from './invitation'
const ElectronStore = require('electron-store')
const contextMenu = require('electron-context-menu')
import sodium from 'libsodium-wrappers-sumo'
// eslint-disable-next-line
const remote = require('@electron/remote/main')
remote.initialize()

const logger = createLogger('main')
let resetting = false
let SOCKET_IO_SECRET: string | undefined = undefined
let updating = false
let rendererReady = false
let quitting = false

const updaterInterval = 15 * 60_000

export const isDev = process.env.NODE_ENV === 'development'
export const isE2Etest = process.env.IS_E2E === 'true'

if (isE2Etest) {
  autoUpdater.autoInstallOnAppQuit = false
}

let mainWindow: BrowserWindow | null
let splash: BrowserWindow | null
let invitationUrl: string | null

const appDataPath = process.env.APP_DATA_PATH!

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
  if (isDev) {
    logger.warn('Second instance started with same DATA_DIR environment variable set. Quitting')
  } else {
    logger.info('This is second instance. Quitting')
  }
  app.quit()
  app.exit()
} else {
  try {
    updateDesktopFile(isDev)
  } catch (e) {
    logger.error(`Couldn't update desktop file`, e)
  }

  app.on('second-instance', (_event, commandLine) => {
    logger.info('Event: app.second-instance', commandLine)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      processInvitationCode(mainWindow, commandLine)
    }
  })
}

logger.info('setAsDefaultProtocolClient', app.setAsDefaultProtocolClient('quiet'))

interface IWindowSize {
  width: number
  height: number
}

logger.info('electron main')

const windowSize: IWindowSize = {
  width: 800,
  height: 540,
}

const crypto = require('crypto').webcrypto
setEngine(
  'newEngine',
  crypto,
  new CryptoEngine({
    name: '',
    crypto: crypto,
    subtle: crypto.subtle,
  })
)

export const isBrowserWindow = (window: BrowserWindow | null): window is BrowserWindow => {
  return window instanceof BrowserWindow
}

const extensionsFolderPath = `${app.getPath('userData')}/extensions`

export const applyDevTools = async () => {
  /* eslint-disable */
  if (!isDev || isE2Etest) return
  /* eslint-disable */
  require('electron-debug')({
    showDevTools: false,
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
      try {
        await installer.default(extension.name)
      } catch (error) {
        logger.info(`Failed to install ${extension.name}:${extension.path}:`, error)
      }
    })
  )

  await Promise.all(
    extensionsData.map(async extension => {
      try {
        await session.defaultSession.loadExtension(extension.path, { allowFileAccess: true })
      } catch (error) {
        logger.error(`Failed to load extension from ${extension.path}:`, error)
      }
    })
  )
}

const requestStateSaveOrQuit = () => {
  if (rendererReady && isBrowserWindow(mainWindow) && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('force-save-state')
    return
  }

  logger.info('Renderer not ready for state save, quitting immediately')
  app.quit()
}

app.on('open-url', (event, url) => {
  // MacOS only
  logger.info('Event app.open-url', url)
  invitationUrl = url // If user opens invitation link with closed app open-url fires too early - before mainWindow is initialized
  event.preventDefault()
  if (mainWindow) {
    invitationUrl = null
    processInvitationCode(mainWindow, url)
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

  electronLocalshortcut.register(mainWindow, 'F10', async () => {
    logger.info('Opening hCaptcha')
    await openHCaptcha('014cd3a6-34c8-49ea-8896-55047514ddb2')
  })

  mainWindow.setMinimumSize(600, 400)
  /* eslint-disable */
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './index.html'),
      search: `dataPort=${ports.dataServer}`,
      protocol: 'file:',
      slashes: true,
      hash: '/',
    })
  )
  /* eslint-enable */
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    logger.info('Event mainWindow.closed')
    rendererReady = false
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
  logger.info('Created mainWindow')
}

export async function openHCaptcha(siteKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    logger.info('Opening hCaptcha with siteKey:', siteKey)
    let settled = false
    const captchaSession = session.fromPartition('persist:hcaptcha')
    const permissionHandler = (_wc: any, _perm: string, cb: (decision: boolean) => void) => cb(false)
    captchaSession.setPermissionRequestHandler(permissionHandler)

    const hostWindow = isBrowserWindow(mainWindow) ? mainWindow : null
    let overlayView: BrowserView | null = null
    let modalWindow: BrowserWindow | null = null
    const hostWindowListeners: Array<{ event: string; listener: (...args: any[]) => void }> = []

    const registerHostWindowListener = (event: string, listener: (...args: any[]) => void) => {
      if (hostWindow && !hostWindow.isDestroyed()) {
        hostWindow.on(event as any, listener)
        hostWindowListeners.push({ event, listener })
      }
    }

    const removeHostWindowListeners = () => {
      if (!hostWindow || hostWindow.isDestroyed()) return
      for (const { event, listener } of hostWindowListeners) {
        hostWindow.removeListener(event as any, listener)
      }
      hostWindowListeners.length = 0
    }

    const cleanup = () => {
      captchaSession.setPermissionRequestHandler(null)
      removeHostWindowListeners()

      if (overlayView) {
        if (hostWindow && !hostWindow.isDestroyed()) {
          try {
            hostWindow.removeBrowserView(overlayView)
          } catch (error) {
            logger.warn('Failed to remove hCaptcha overlay', error)
          }
        }
        overlayView = null
      }

      if (modalWindow && !modalWindow.isDestroyed()) {
        modalWindow.destroy()
      }
      modalWindow = null

      if (hostWindow && !hostWindow.isDestroyed()) {
        hostWindow.webContents.focus()
      }
    }

    let solvedHandler: ((event: Electron.IpcMainEvent, token: string) => void) | null = null
    let failedHandler: ((event: Electron.IpcMainEvent, message: string) => void) | null = null

    const resolveOnce = (token: string) => {
      if (settled) return
      settled = true
      if (failedHandler) {
        ipcMain.removeListener('hcaptcha:error', failedHandler)
      }
      cleanup()
      resolve(token)
    }

    const rejectOnce = (message: string) => {
      if (settled) return
      settled = true
      if (solvedHandler) {
        ipcMain.removeListener('hcaptcha:solved', solvedHandler)
      }
      cleanup()
      reject(new Error(message))
    }

    solvedHandler = (_event, token) => resolveOnce(token)
    failedHandler = (_event, message) => rejectOnce(message)

    ipcMain.once('hcaptcha:solved', solvedHandler)
    ipcMain.once('hcaptcha:error', failedHandler)

    const dataServerPort = ports?.dataServer
    if (!dataServerPort) {
      rejectOnce('Captcha server not ready')
      return
    }
    const captchaUrl = `http://127.0.0.1:${dataServerPort}/hcaptcha?sitekey=${encodeURIComponent(siteKey)}`

    if (hostWindow) {
      overlayView = new BrowserView({
        webPreferences: {
          preload: path.join(__dirname, 'preload.captcha.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          partition: 'persist:hcaptcha',
        },
      })

      overlayView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
      overlayView.webContents.on('will-navigate', event => event.preventDefault())
      overlayView.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        if (errorCode === -3 /* ERR_ABORTED */) return
        rejectOnce(`Captcha load failed (${errorCode}): ${errorDescription}`)
      })
      overlayView.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        logger.debug(`hCaptcha overlay console [${level}] ${message} (${sourceId}:${line})`)
      })

      const updateBounds = () => {
        if (!overlayView || !hostWindow || hostWindow.isDestroyed()) return
        const { width, height } = hostWindow.getContentBounds()
        overlayView.setBounds({ x: 0, y: 0, width, height })
      }

      hostWindow.addBrowserView(overlayView)
      overlayView.setAutoResize({ width: true, height: true })
      updateBounds()

      registerHostWindowListener('resize', updateBounds)
      registerHostWindowListener('enter-full-screen', updateBounds)
      registerHostWindowListener('leave-full-screen', updateBounds)
      registerHostWindowListener('focus', updateBounds)
      registerHostWindowListener('closed', () => rejectOnce('Parent window closed'))

      overlayView.webContents.once('did-finish-load', () => {
        overlayView?.webContents.focus()
      })

      overlayView.webContents.loadURL(captchaUrl).catch(error => {
        rejectOnce(error?.message ?? 'Failed to load captcha')
      })

      return
    }

    modalWindow = new BrowserWindow({
      width: 420,
      height: 520,
      resizable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      parent: hostWindow ?? undefined,
      show: false,
      autoHideMenuBar: true,
      title: 'Human verification',
      webPreferences: {
        preload: path.join(__dirname, 'preload.captcha.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition: 'persist:hcaptcha',
      },
    })

    modalWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    modalWindow.webContents.on('will-navigate', event => event.preventDefault())
    modalWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      if (errorCode === -3 /* ERR_ABORTED */) return
      rejectOnce(`Captcha load failed (${errorCode}): ${errorDescription}`)
    })
    modalWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      logger.debug(`hCaptcha modal console [${level}] ${message} (${sourceId}:${line})`)
    })
    modalWindow.on('closed', () => {
      rejectOnce('Captcha window closed')
    })

    modalWindow.loadURL(captchaUrl).catch(error => {
      rejectOnce(error?.message ?? 'Failed to load captcha')
    })

    modalWindow.once('ready-to-show', () => modalWindow?.show())
  })
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

export const checkForUpdate = async () => {
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    if (isNetworkError(error)) {
      logger.warn(`updater: ${error.message}`)
    } else {
      logger.error(error)
    }
  }
}

const setupUpdater = async () => {
  autoUpdater.on('checking-for-update', () => {
    logger.info('updater: checking-for-update')
  })
  autoUpdater.on('error', error => {
    logger.info('updater: error:', error)
  })
  autoUpdater.on('update-not-available', () => {
    logger.info('updater: update-not-available')
  })
  autoUpdater.on('update-available', info => {
    logger.info('updater: update-available:', info)
  })
  autoUpdater.on('update-downloaded', () => {
    logger.info('updater: update-downloaded')
    if (isBrowserWindow(mainWindow)) {
      mainWindow.webContents.send('newUpdateAvailable')
    }
  })
  autoUpdater.on('before-quit-for-update', () => {
    logger.info('updater: before-quit-for-update')
  })
}

let ports: ApplicationPorts
let backendProcess: ChildProcess | null = null

app.on('ready', async () => {
  logger.info('Event: app.ready')
  await sodium.ready
  SOCKET_IO_SECRET = sodium.to_hex(sodium.randombytes_buf(32))

  Menu.setApplicationMenu(null)

  await applyDevTools()

  contextMenu({
    showInspectElement: false,
    showSaveLinkAs: true,
    showCopyLink: true,
    showSaveImage: true,
    showCopyImage: true,
    showSaveImageAs: true,
  })

  if (quitting) {
    logger.info('Quit requested before backend setup, skipping startup')
    return
  }

  ports = await getPorts()
  await createWindow()

  mainWindow?.webContents.on('did-finish-load', () => {
    rendererReady = true
    // Only send the secret to the renderer via IPC, not via URL
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
  ]

  const backendBundlePath = path.normalize(require.resolve('backend-bundle'))
  try {
    closeHangingBackendProcess(path.normalize(path.join('backend-bundle', 'bundle.cjs')), path.normalize(appDataPath))
  } catch (e) {
    logger.error('Error occurred while trying to close hanging backend process', e)
  }

  logger.info('Environment variables', JSON.stringify(process.env, null, 2))

  backendProcess = fork(backendBundlePath, forkArgvs, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: {
      NODE_OPTIONS: '--trace-uncaught --enable-source-maps',
      DEBUG: process.env.DEBUG,
      LOG_DIR: process.env.LOG_DIR,
      COLORIZE: process.env.COLORIZE ?? 'true',
      LOG_TO_FILE: process.env.LOG_TO_FILE ?? 'true',
      STATIC_LOG_ID: process.env.STATIC_LOG_ID,
      QSS_ALLOWED: process.env.QSS_ALLOWED ?? 'false',
      QSS_ENDPOINT: process.env.QSS_ENDPOINT,
      QPS_ALLOWED: process.env.QPS_ALLOWED ?? 'false',
      HCAPTCHA_TEMPLATE_PATH: path.join(__dirname, 'captcha.html'),
      HCAPTCHA_FORWARD_ENDPOINT: process.env.HCAPTCHA_FORWARD_ENDPOINT,
      IS_E2E: process.env.IS_E2E ?? 'false',
    },
  })
  logger.info('Forked backend, PID:', backendProcess.pid)

  const solveCaptcha = async (siteKey?: string) => {
    const resolvedSiteKey = siteKey ?? process.env.HCAPTCHA_SITEKEY
    logger.info('hCaptcha requested, siteKey:', resolvedSiteKey)
    if (!resolvedSiteKey) {
      const message = 'Missing hCaptcha site key'
      logger.error(message)
      if (backendProcess) {
        backendProcess.send({ type: 'hcaptcha-error', message })
      }
      if (isBrowserWindow(mainWindow)) {
        mainWindow.webContents.send('hcaptcha:error', message)
      }
      return
    }

    try {
      let token: string
      if (process.env.IS_E2E === 'true') {
        token = '10000000-aaaa-bbbb-cccc-000000000001' // Test token from https://docs.hcaptcha.com/#test-key-set-publisher-or-pro-account
      } else {
        token = await openHCaptcha(resolvedSiteKey)
      }
      if (isBrowserWindow(mainWindow)) {
        mainWindow.webContents.send('hcaptcha:token', token)
      }
      return token
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Captcha challenge failed'
      logger.error('hCaptcha challenge failed', error)
      if (isBrowserWindow(mainWindow)) {
        mainWindow.webContents.send('hcaptcha:error', message)
      }
    }
  }

  function isReadyForSecretMessage(msg: any): msg is { type: string; nonce: string } {
    return msg && typeof msg === 'object' && msg.type === 'readyForSecret' && typeof msg.nonce === 'string'
  }

  function isCaptchaRequestMessage(msg: unknown): msg is { type: 'request-hcaptcha'; siteKey?: string } {
    return (
      typeof msg === 'object' && msg !== null && 'type' in msg && (msg as { type: string }).type === 'request-hcaptcha'
    )
  }

  let sentSecret = false
  backendProcess.on('message', msg => {
    logger.info('Received message from backend:', msg)
    if (isReadyForSecretMessage(msg) && !sentSecret) {
      // Send the secret securely via IPC after verifying the nonce
      sentSecret = true
      backendProcess?.send({ type: 'set-socket-secret', secret: SOCKET_IO_SECRET, nonce: msg.nonce })
      mainWindow?.webContents.send('socketIOSecret', SOCKET_IO_SECRET)
      SOCKET_IO_SECRET = undefined // Clear the secret after sending it
      return
    }

    if (isCaptchaRequestMessage(msg)) {
      solveCaptcha(msg.siteKey).catch(error => {
        logger.error('Error while handling hCaptcha request from backend', error)
      })
    }
  })

  ipcMain.handle('hcaptcha:request', async (_event, args: { siteKey?: string } = {}) => {
    return solveCaptcha(args.siteKey)
  })

  backendProcess.on('close', (code, signal) => {
    logger.warn('Backend process close event', code, signal)
    backendProcess = null
    if (updating) return
    requestStateSaveOrQuit()
  })

  backendProcess.on('error', e => {
    logger.error('Backend process returned error', e)
    throw Error(e.message)
  })

  if (!isBrowserWindow(mainWindow)) {
    throw new Error(`mainWindow is on unexpected type ${mainWindow}`)
  }

  mainWindow.webContents.on('did-fail-load', () => {
    logger.error('failed loading webcontents')
  })

  mainWindow.on('close', e => {
    if (resetting) return

    // --- macOS: hide instead of destroying the renderer ---
    if (process.platform === 'darwin' && !updating && backendProcess !== null) {
      logger.info('Main window close (macOS) will hide after saving state')
      e.preventDefault()
      mainWindow?.webContents.send('force-save-state') // state‑saved → hide
      return
    }

    // If the backend is still running we must wait for it to exit first
    if (backendProcess !== null) {
      logger.info('Main window close intercepted, waiting for backend to exit')
      if (!updating) {
        e.preventDefault()
      }
      backendProcess.send('close')
      return
    }
    logger.info('Main window close event, saving state')
    mainWindow?.webContents.send('force-save-state') // state‑saved → hide
  })

  // splash window is destroyed when mainWindow is ready and close should not fire in regular case
  splash?.once('close', e => {
    if (resetting) return

    // in the case where the user closes the splash window before the main window is ready
    // we close the backend process and quit the app
    if (backendProcess !== null) {
      if (!updating) {
        e.preventDefault()
      }
      logger.info('Closing splash window')
      backendProcess?.send('close')
      return
    }
    logger.info('Splash window close event, saving state')
    mainWindow?.webContents.send('force-save-state')
  })

  ipcMain.on('state-saved', () => {
    if (updating) return

    if (backendProcess === null) {
      logger.info('State saved, quitting app')
      app.quit()
      return
    }
    if (process.platform === 'darwin' && !updating) {
      logger.info('Saved state hiding window (macOS)')
      mainWindow?.hide()
    } else {
      logger.info('Saved state closing window')
      mainWindow?.close()
    }
  })

  ipcMain.on('clear-community', () => {
    logger.info('ipcMain: clear-community')
    resetting = true
    backendProcess?.once('message', msg => {
      if (msg === 'leftCommunity') {
        resetting = false
      }
    })
    backendProcess?.send('leaveCommunity')
  })

  ipcMain.on('restart-app', () => {
    logger.info('ipcMain: restart-app')
    app.relaunch()
    backendProcess?.send('close')
  })

  ipcMain.on('writeTempFile', (event, arg) => {
    logger.info('ipcMain: writeTempFile')
    const temporaryFilesDirectory = path.join(appDataPath, 'temporaryFiles')
    fs.mkdirSync(temporaryFilesDirectory, { recursive: true })
    const id = `${Date.now()}_${Math.random().toString(36).substring(0, 20)}`
    const name = arg.ext ? arg.fileName.split(arg.ext)[0] : arg.fileName
    const filePath = `${path.join(temporaryFilesDirectory, `${name}_${id}${arg.ext}`)}`
    fs.writeFileSync(filePath, arg.fileBuffer)

    event.reply('writeTempFileReply', {
      path: filePath,
      id,
      name,
      ext: arg.ext,
    })
  })

  ipcMain.on('openUploadFileDialog', async e => {
    logger.info('ipcMain: openUploadFileDialog')
    let filesDialogResult: Electron.OpenDialogReturnValue
    if (!mainWindow) {
      logger.error('openUploadFileDialog - no mainWindow')
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
    logger.info('Event: mainWindow did-finish-load')
    if (!isBrowserWindow(mainWindow)) {
      throw new Error(`mainWindow is on unexpected type ${mainWindow}`)
    }
    if (process.platform === 'darwin' && invitationUrl) {
      try {
        processInvitationCode(mainWindow, invitationUrl)
      } catch (e) {
        logger.error('Error while processing invitation code from url', e)
      } finally {
        invitationUrl = null
      }
    }
    if (process.platform !== 'darwin' && process.argv) {
      try {
        processInvitationCode(mainWindow, process.argv)
      } catch (e) {
        logger.error('Error while processing invitation code from arguments')
      }
    }

    await setupUpdater()
    await checkForUpdate()
    setInterval(async () => {
      await checkForUpdate()
    }, updaterInterval)
  })

  ipcMain.on('proceed-update', () => {
    logger.info('ipcMain: proceed-update')
    updating = true
    autoUpdater.quitAndInstall()
  })
})

app.on('browser-window-created', (_, window) => {
  logger.info('Event: app.browser-window-created', window.getTitle())
  remote.enable(window.webContents)
})

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
  logger.info('Event: app.window-all-closed')
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // NOTE: now only fully quits on Win/Linux; on macOS app remains open after window is closed.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  logger.info('Event: app.activate')
  if (mainWindow === null) {
    logger.info('App activate mainWindow is null, creating new window')
    await createWindow()
  } else {
    logger.info('App activate showing existing hidden window')
    mainWindow.show()
  }
})

app.on('before-quit', e => {
  quitting = true
  if (backendProcess !== null) {
    logger.info('App before-quit intercepted waiting for backend to exit')
    if (!updating) {
      e.preventDefault()
    }
    if (backendProcess) {
      backendProcess.send('close')
    }
    return
  }
  logger.info('App before-quit backend exited, quitting app')
})
