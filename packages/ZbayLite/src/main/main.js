import { app, BrowserWindow, Menu } from 'electron'

import { spawnZcashNode, ensureZcashParams } from './zcash/bootstrap'

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
  })
})

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
