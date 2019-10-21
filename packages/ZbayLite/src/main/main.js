import { app, BrowserWindow, Menu, ipcMain } from 'electron'

import { spawnZcashNode, ensureZcashParams } from './zcash/bootstrap'
import { autoUpdater } from 'electron-updater'

const isDev = process.env.NODE_ENV === 'development'

const isTestnet = parseInt(process.env.ZBAY_IS_TESTNET)
const nodeURL = process.env.ZBAY_NODE_URL

const installExtensions = async () => {
  require('electron-debug')({
    showDevTools: true
  })

  const installer = require('electron-devtools-installer')
  const forceDownload = Boolean(process.env.UPGRADE_EXTENSIONS)
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

  try {
    await Promise.all(extensions.map(ext => installer.default(installer[ext], forceDownload)))
  } catch (err) {
    console.error("Couldn't install devtools.")
  }
}

const windowSize = {
  width: 1024,
  height: 768
}

var mainWindow
var nodeProc = null

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    const url = new URL(commandLine[1])
    if (url.searchParams.has('invitation')) {
      mainWindow.webContents.send('newInvitation', {
        invitation: url.searchParams.get('invitation')
      })
    }
    if (url.searchParams.has('importchannel')) {
      mainWindow.webContents.send('newChannel', {
        channelParams: url.searchParams.get('importchannel')
      })
    }
  })
}
app.on('open-url', (event, url) => {
  event.preventDefault()
  const data = new URL(url)
  if (mainWindow) {
    if (data.searchParams.has('invitation')) {
      mainWindow.webContents.send('newInvitation', {
        invitation: data.searchParams.get('invitation')
      })
    }
    if (data.searchParams.has('importchannel')) {
      mainWindow.webContents.send('newChannel', {
        channelParams: data.searchParams.get('importchannel')
      })
    }
  }
})

const createZcashNode = win => {
  win.webContents.send('bootstrappingNode', {
    message: 'Ensuring zcash params are present',
    bootstrapping: true
  })
  ensureZcashParams(process.platform, error => {
    if (error) {
      throw error
    }
    win.webContents.send('bootstrappingNode', {
      message: 'Launching zcash node',
      bootstrapping: true
    })
    nodeProc = spawnZcashNode(process.platform, isTestnet)
    mainWindow.webContents.send('bootstrappingNode', {
      message: '',
      bootstrapping: false
    })
    nodeProc.on('close', () => {
      nodeProc = null
    })
  })
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.setMinimumSize(windowSize.width, windowSize.height)
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const checkForUpdate = win => {
  autoUpdater.checkForUpdates()
  autoUpdater.on('check-for-update', () => {
    console.log('checking for updates...')
  })
  autoUpdater.on('error', error => {
    console.log(error)
  })
  autoUpdater.on('update-available', info => {
    console.log(info)
  })

  autoUpdater.on('update-downloaded', info => {
    win.webContents.send('newUpdateAvailable')
  })
}

app.on('ready', async () => {
  const template = [
    {
      label: 'Zbay',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  if (isDev) {
    await installExtensions()
  }
  createWindow()

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ping')
    if (!nodeURL) {
      createZcashNode(mainWindow)
    }
    if (!isDev) {
      checkForUpdate(mainWindow)
    }
  })

  ipcMain.on('proceed-update', (event, arg) => {
    autoUpdater.quitAndInstall()
  })
})

process.on('exit', () => {
  if (nodeProc !== null) {
    nodeProc.kill()
  }
})
app.setAsDefaultProtocolClient('zbay')

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
