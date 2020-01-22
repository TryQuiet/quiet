import getSize from 'get-folder-size'
import checkDiskSpace from 'check-disk-space'
import { app, BrowserWindow, Menu, ipcMain, globalShortcut, powerSaveBlocker } from 'electron'
import os from 'os'
import path from 'path'
import url from 'url'
import { autoUpdater } from 'electron-updater'
import fs from 'fs-extra'
import axios from 'axios'
import request from 'request'
import zlib from 'zlib'
import progress from 'request-progress'
import util from 'util'
import convert from 'convert-seconds'

import config from './config'
import { spawnZcashNode } from './zcash/bootstrap'
import electronStore from '../shared/electronStore'

const osPathsBlockchain = {
  darwin: `${process.env.HOME || process.env.USERPROFILE}/Library/Application Support/Zcash/`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash/`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zcash\\`
}

const BLOCKCHAIN_SIZE = 21602539059

const downloadedFilesSizes = [0, 0, 0, 0]

const calculateDownloadSpeed = (fetchedSize) => {
  const v = (-downloadedFilesSizes[0] / 3) + (3 * downloadedFilesSizes[1] / 2) - (3 * downloadedFilesSizes[2]) + (11 / 6 * downloadedFilesSizes[3])
  downloadedFilesSizes.shift()
  downloadedFilesSizes.push(fetchedSize)
  return v
}

const downloadManagerForZipped = function ({ url, path, index, fileName, part, length }) {
  const gunzip = zlib.createGunzip()

  return new Promise(function (resolve, reject) {
    let fileSize = 0
    const fetchedSize = electronStore.get('AppStatus.fetchedSize')
    progress(request(url), {
      throttle: 500
    }).on('progress', function (state) {
      fileSize = state.size.total
      if (part === 'params') {
        const eta = state.speed ? convert(((BLOCKCHAIN_SIZE - fetchedSize) / state.speed).toFixed()) : null
        mainWindow.webContents.send('fetchingStatus', {
          part: part,
          sizeLeft: BLOCKCHAIN_SIZE - fetchedSize,
          speed: state.speed || null,
          eta
        })
      }
    })
      .on('error', function (err) {
        electronStore.set(`AppStatus.${part}`, {
          status: config.PARAMS_STATUSES.ERROR,
          lastDownload: fileName,
          index
        })
        reject(err)
      })
      .on('end', function () {
        electronStore.set(`AppStatus.${part}`, {
          status: config.PARAMS_STATUSES.FETCHING,
          lastDownload: fileName,
          index
        })
        electronStore.set('AppStatus.fetchedSize', fetchedSize + fileSize)
        if ((index === length - 1) && part === 'blockchain') {
          mainWindow.webContents.send('fetchingStatus', {
            part: part,
            status: config.BLOCKCHAIN_STATUSES.SUCCESS
          })
        }
        resolve(console.log('100% \n Download Completed'))
      })
      .pipe(gunzip).pipe(fs.createWriteStream(path))
  })
}

const isTestnet = parseInt(process.env.ZBAY_IS_TESTNET)
let nodeProc = null

export const isDev = process.env.NODE_ENV === 'development'
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

const checkPath = (pathToCreate) => {
  if (!fs.existsSync(pathToCreate)) {
    fs.mkdirSync(pathToCreate)
  }
}

const fetchParams = async (win, torUrl) => {
  const osPathsParams = {
    darwin: `${process.env.HOME || process.env.USERPROFILE}/Library/Application Support/ZcashParams/`,
    linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash-params/`,
    win32: `${os.userInfo().homedir}\\AppData\\Roaming\\ZcashParams\\`
  }
  checkPath(osPathsParams[process.platform])
  const { data } = await axios({
    url: config.PARAMS_LINK,
    method: 'get'
  })

  const indexSize = data.length
  const { index, status, lastDownload } = electronStore.get('AppStatus.params')
  if (status === config.PARAMS_STATUSES.ERROR) {
    fs.unlinkSync(`${osPathsParams[process.platform]}${lastDownload}`)
  }
  for (const target of data.slice(index, data.length)) {
    const { fileName, targetUrl, index } = target
    const preparedFilePath = process.platform === 'win32' ? fileName.split('/').join('\\\\') : fileName
    await downloadManagerForZipped({ url: targetUrl, path: `${osPathsParams[process.platform]}${preparedFilePath}`, index, fileName: preparedFilePath, part: 'params', length: indexSize })
  }
  electronStore.set('AppStatus.params', {
    status: config.PARAMS_STATUSES.SUCCESS
  })
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
}

const fetchBlockchain = async (win, torUrl) => {
  const pathList = [
    `${osPathsBlockchain[process.platform]}`,
    `${osPathsBlockchain[process.platform]}${process.platform === 'win32' ? 'blocks\\' : 'blocks/'}`,
    `${osPathsBlockchain[process.platform]}${process.platform === 'win32' ? 'blocks\\index\\' : 'blocks/index/'}`,
    `${osPathsBlockchain[process.platform]}${process.platform === 'win32' ? 'chainstate\\' : 'chainstate/'}`
  ]

  const { data } = await axios({
    url: config.BLOCKCHAIN_LINK,
    method: 'get'
  })

  const { index, status, lastDownload } = electronStore.get('AppStatus.blockchain')
  if (status === config.BLOCKCHAIN_STATUSES.TO_FETCH) {
    fs.emptyDirSync(osPathsBlockchain[process.platform])
  }

  if (status === config.BLOCKCHAIN_STATUSES.ERROR || status === config.BLOCKCHAIN_STATUSES.FETCHING) {
    fs.unlinkSync(`${osPathsBlockchain[process.platform]}${lastDownload}`)
  }

  pathList.forEach(path => checkPath(path))

  const refreshInterval = setInterval(() => {
    const fetchedSize = electronStore.get('AppStatus.fetchedSize')
    const speed = calculateDownloadSpeed(fetchedSize)
    const convertedSpeed = speed ? Math.abs(speed.toFixed()) : null
    const eta = convertedSpeed ? convert(((BLOCKCHAIN_SIZE - fetchedSize) / convertedSpeed).toFixed()) : null
    mainWindow.webContents.send('fetchingStatus', {
      eta,
      speed: convertedSpeed
    })
  }, 1000)

  for (const target of data.slice(index, data.length)) {
    const { fileName, targetUrl, index } = target
    const preparedFilePath = process.platform === 'win32' ? fileName.split('/').join('\\\\') : fileName
    await downloadManagerForZipped({ url: targetUrl, path: `${osPathsBlockchain[process.platform]}${preparedFilePath}`, index, fileName: preparedFilePath, part: 'blockchain', length: data.length })
  }

  clearInterval(refreshInterval)

  electronStore.set('AppStatus.blockchain', {
    status: config.BLOCKCHAIN_STATUSES.SUCCESS
  })
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
}

const createZcashNode = async (win, torUrl) => {
  const getFolderSizePromise = util.promisify(getSize)
  const blockchainFolderSize = await getFolderSizePromise(`${osPathsBlockchain[process.platform]}`)
  const isFetchedFromExternalSource = blockchainFolderSize >= 26046042950
  let AppStatus = electronStore.get('AppStatus')
  const vaultStatus = electronStore.get('vaultStatus')
  if (!isDev) {
    if (!AppStatus && !isFetchedFromExternalSource) {
      electronStore.set('AppStatus', {
        params: {
          status: config.PARAMS_STATUSES.FETCHING,
          lastDownload: '',
          index: 0
        },
        blockchain: {
          status: config.BLOCKCHAIN_STATUSES.TO_FETCH,
          lastDownload: '',
          index: 0
        },
        fetchedSize: 0
      })
      await fetchParams(win, torUrl)
    }
    const { status: paramsStatus } = electronStore.get('AppStatus.params')
    const { status: blockchainStatus } = electronStore.get('AppStatus.blockchain')
    if (paramsStatus !== config.PARAMS_STATUSES.SUCCESS && !isFetchedFromExternalSource) {
      await fetchParams(win, torUrl)
    }
    if (blockchainStatus !== config.PARAMS_STATUSES.SUCCESS && vaultStatus === config.VAULT_STATUSES.CREATED && !isFetchedFromExternalSource) {
      await fetchBlockchain(win, torUrl)
    } else {
      if (vaultStatus) {
        nodeProc = spawnZcashNode(process.platform, isTestnet, torUrl)
        mainWindow.webContents.send('bootstrappingNode', {
          message: '',
          bootstrapping: false
        })
        nodeProc.on('close', () => {
          console.log('closing connection')
          nodeProc = null
        })
      }
    }
  } else {
    nodeProc = spawnZcashNode(process.platform, isTestnet, torUrl)
    mainWindow.webContents.send('bootstrappingNode', {
      message: '',
      bootstrapping: false
    })
    nodeProc.on('close', () => {
      console.log('closing connection')
      nodeProc = null
    })
  }
}

app.on('ready', async () => {
  powerSaveBlocker.start('prevent-app-suspension')
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

  globalShortcut.register('F11', () => {
    mainWindow.webContents.send('toggleCoordinator', {})
  })

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
      }, 15 * 60000)
    }
  })

  ipcMain.on('proceed-update', (event, arg) => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.on('vault-created', (event, arg) => {
    electronStore.set('vaultStatus', config.VAULT_STATUSES.CREATED)
    if (!isDev) {
      const { status } = electronStore.get('AppStatus.blockchain')
      if (status !== config.BLOCKCHAIN_STATUSES.SUCCESS) {
        nodeProc.on('close', (code) => {
          setTimeout(() => {
            fetchBlockchain(mainWindow)
          }, 1000)
        })
        nodeProc.kill()
      }
    }
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
