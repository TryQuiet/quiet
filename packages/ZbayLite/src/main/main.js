import getSize from 'get-folder-size'
import checkDiskSpace from 'check-disk-space'
import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import os from 'os'
import path from 'path'
import url from 'url'
import { autoUpdater } from 'electron-updater'
import fs from 'fs-extra'

import { spawnZcashNode, ensureZcashParams } from './zcash/bootstrap'

const isTestnet = parseInt(process.env.ZBAY_IS_TESTNET)
let nodeProc = null

const isDev = process.env.NODE_ENV === 'development'
const installExtensions = async () => {
  require('electron-debug')({
    showDevTools: true
  })

  const installer = require('electron-devtools-installer')
  const forceDownload = Boolean(process.env.UPGRADE_EXTENSIONS)
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

  try {
    await Promise.all(
      extensions.map(ext => installer.default(installer[ext], forceDownload))
    )
  } catch (err) {
    console.error("Couldn't install devtools.")
  }
}

const windowSize = {
  width: 1024,
  height: 768
}

var mainWindow
let running = false

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

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.setMinimumSize(600, 400)
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './index.html'),
      protocol: 'file:',
      slashes: true,
      hash: '/vault'
    })
  )

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

const createZcashNode = (win, torUrl) => {
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
    nodeProc = spawnZcashNode(process.platform, isTestnet, torUrl)
    mainWindow.webContents.send('bootstrappingNode', {
      message: '',
      bootstrapping: false
    })
    nodeProc.on('close', () => {
      nodeProc = null
    })
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

  await installExtensions()

  createWindow()
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ping')
    const osPaths = {
      darwin: `${process.env.HOME ||
        process.env.USERPROFILE}/Library/Application Support/Zcash`,
      linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash`,
      win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zcash`
    }

    const BLOCKCHAIN_SIZE = 27843545600
    const REQUIRED_FREE_SPACE = 1073741824
    const ZCASH_PARAMS = 1825361100

    if (!fs.existsSync(osPaths[process.platform])) {
      fs.mkdirSync(osPaths[process.platform])
    }

    getSize(osPaths[process.platform], (err, downloadedSize) => {
      if (err) {
        throw err
      }
      checkDiskSpace('/').then(diskspace => {
        const blockchainSizeLeftToFetch = BLOCKCHAIN_SIZE - downloadedSize
        const freeSpaceLeft =
          diskspace.free -
          (blockchainSizeLeftToFetch + ZCASH_PARAMS + REQUIRED_FREE_SPACE)
        if (freeSpaceLeft <= 0) {
          mainWindow.webContents.send(
            'checkDiskSpace',
            `Sorry, but Zbay needs ${(
              blockchainSizeLeftToFetch /
              1024 ** 3
            ).toFixed(2)} GB to connect to its network and you only have ${(
              diskspace.free /
              1024 ** 3
            ).toFixed(2)} free.`
          )
        }
      })
    })

    if (!isDev) {
      checkForUpdate(mainWindow)
      setInterval(() => {
        checkForUpdate(mainWindow)
      }, 15 * 60)
    }
  })

  ipcMain.on('proceed-update', (event, arg) => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.on('create-node', (event, arg) => {
    let torUrl
    if (arg) {
      torUrl = arg.toString()
    }
    if (!running) {
      running = true
      if (!isDev) {
        createZcashNode(mainWindow, torUrl)
      }
    }
  })
})

app.setAsDefaultProtocolClient('zbay')

process.on('exit', () => {
  if (nodeProc !== null) {
    nodeProc.kill()
  }
})

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
