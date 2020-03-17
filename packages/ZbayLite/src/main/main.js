import getSize from 'get-folder-size'
import checkDiskSpace from 'check-disk-space'
import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut,
  powerSaveBlocker
} from 'electron'
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
import R from 'ramda'
import findInFiles from 'find-in-files'

import { createRpcCredentials } from '../renderer/zcash'
import config from './config'
import { spawnZcashNode } from './zcash/bootstrap'
import electronStore from '../shared/electronStore'

const osPathsBlockchain = {
  darwin: `${process.env.HOME ||
    process.env.USERPROFILE}/Library/Application Support/Zcash/`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash/`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zcash\\`
}

const osPathsParams = {
  darwin: `${process.env.HOME ||
    process.env.USERPROFILE}/Library/Application Support/ZcashParams/`,
  linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash-params/`,
  win32: `${os.userInfo().homedir}\\AppData\\Roaming\\ZcashParams\\`
}

const getFolderSizePromise = util.promisify(getSize)
let isFetchedFromExternalSource = false

const BLOCKCHAIN_SIZE = 26602539059
const isFetchingArr = []
let prevFetchedSize = 0

const calculateDownloadSpeed = (downloadedSize, source) => {
  const diff = downloadedSize - prevFetchedSize
  prevFetchedSize = downloadedSize
  const speedInSec = diff / 3
  const convertedSpeed = speedInSec ? Math.abs(speedInSec.toFixed()) : null
  const estimatedTimeForRescanning = 800
  let isFetching = false
  const eta = convertedSpeed
    ? convert(((parseInt(((BLOCKCHAIN_SIZE - downloadedSize) / convertedSpeed)) + estimatedTimeForRescanning)))
    : null
  if (isFetchingArr.length < 2) {
    isFetchingArr.push(convertedSpeed)
  } else {
    const [prevSpeedValue, currentSpeedValue] = isFetchingArr
    isFetching = prevSpeedValue !== currentSpeedValue
    isFetchingArr.shift()
    isFetchingArr.push(convertedSpeed)
  }
  if (mainWindow) {
    mainWindow.webContents.send('fetchingStatus', {
      sizeLeft: source === 'params' ? BLOCKCHAIN_SIZE : BLOCKCHAIN_SIZE - downloadedSize,
      speed: convertedSpeed,
      eta,
      isFetching: isFetching ? 'IN_PROGRESS' : 'INTERRUPTED'
    })
  }
}

let checkSizeInterval

const downloadManagerForZippedBlockchain = ({ data, source }) => {
  const dataToFetch = R.clone(data)
  let downloadedFilesCounter = 0
  const targetCounter = source === 'params' ? 1 : 5
  const saveFileListToElectronStore = () => {
    if (downloadedFilesCounter >= targetCounter) {
      electronStore.set(`AppStatus.${source === 'params' ? 'params' : 'blockchain'}`, {
        status: config.PARAMS_STATUSES.FETCHING,
        filesToFetch: dataToFetch
      })
      downloadedFilesCounter = 0
    } else {
      downloadedFilesCounter++
    }
  }
  return new Promise(function (resolve, reject) {
    let downloadedSize = 0
    const checkFetchedSize = () => {
      getSize(source === 'params' ? osPathsParams[process.platform] : osPathsBlockchain[process.platform],
        (err, size) => {
          if (err) {
            throw err
          }
          downloadedSize = size
          calculateDownloadSpeed(downloadedSize, source)
        })
    }
    checkSizeInterval = setInterval(() => {
      checkFetchedSize()
    }, 3000)
    app.on('will-quit', () => {
      clearInterval(checkSizeInterval)
      reject(console.log('app exited'))
    })
    const startFetching = (data) => {
      let item
      const gunzip = zlib.createGunzip()
      if (!data[0]) return
      const { fileName, targetUrl } = data[0]
      item = data.shift()
      const preparedFilePath = process.platform === 'win32' ? fileName.split('/').join('\\\\') : fileName
      const path = source === 'params' ? `${osPathsParams[process.platform]}${preparedFilePath}` : `${osPathsBlockchain[process.platform]}${preparedFilePath}`
      const handleErrors = (err) => {
        console.log(err, item)
        data.push(item)
        startFetching(data)
      }
      progress(request(targetUrl), {
        throttle: 500
      })
        .on('error', function (err) {
          handleErrors(err)
        })
        .pipe(gunzip)
        .on('end', () => {
          const indexToDelete = R.findIndex(R.propEq('fileName', fileName), dataToFetch)
          dataToFetch.splice(indexToDelete, 1)
          saveFileListToElectronStore()
          if (data.length !== 0) {
            setTimeout(() => startFetching(data), 0)
          } else {
            if (dataToFetch.length === 0) {
              if (source !== 'params') {
                mainWindow.webContents.send('fetchingStatus', {
                  part: 'blockchain',
                  status: config.BLOCKCHAIN_STATUSES.SUCCESS
                })
              }
              clearInterval(checkSizeInterval)
              resolve(console.log('Download Completed'))
            }
          }
        })
        .on('error', (err) => {
          handleErrors(err)
        })
        .pipe(fs.createWriteStream(path))
        .on('error', (err) => {
          handleErrors(err)
        })
    }
    if (source === 'params') {
      startFetching(data)
    } else {
      startFetching(data)
      startFetching(data)
      startFetching(data)
      startFetching(data)
    }
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
    },
    autoHideMenuBar: true
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
  autoUpdater.on('checking-for-update', () => {
    console.log('checking for updates...')
  })
  autoUpdater.on('error', error => {
    console.log(error)
  })
  autoUpdater.on('update-not-available', () => {
    console.log('event no update')
    electronStore.set('updateStatus', config.UPDATE_STATUSES.NO_UPDATE)
  })
  autoUpdater.on('update-available', info => {
    console.log(info)
    electronStore.set('updateStatus', config.UPDATE_STATUSES.PROCESSING_UPDATE)
  })

  autoUpdater.on('update-downloaded', info => {
    const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
    const paramsStatus = electronStore.get('AppStatus.params.status')
    if (blockchainStatus !== config.BLOCKCHAIN_STATUSES.SUCCESS || paramsStatus !== config.PARAMS_STATUSES.SUCCESS) {
      autoUpdater.quitAndInstall()
    } else {
      win.webContents.send('newUpdateAvailable')
    }
  })
}

const checkPath = pathToCreate => {
  if (!fs.existsSync(pathToCreate)) {
    fs.mkdirSync(pathToCreate)
  }
}

const fetchParams = async (win, torUrl) => {
  checkPath(osPathsParams[process.platform])

  const { filesToFetch } = electronStore.get(
    'AppStatus.params'
  )

  let downloadArray
  if (!filesToFetch) {
    const { data } = await axios({
      url: config.PARAMS_LINK,
      method: 'get'
    })
    downloadArray = data
  } else {
    downloadArray = filesToFetch
  }
  await downloadManagerForZippedBlockchain({ data: downloadArray, source: 'params' })

  electronStore.set('AppStatus.params', {
    status: config.PARAMS_STATUSES.SUCCESS,
    filesToFetch: []
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
    `${osPathsBlockchain[process.platform]}${
      process.platform === 'win32' ? 'blocks\\' : 'blocks/'
    }`,
    `${osPathsBlockchain[process.platform]}${
      process.platform === 'win32' ? 'blocks\\index\\' : 'blocks/index/'
    }`,
    `${osPathsBlockchain[process.platform]}${
      process.platform === 'win32' ? 'chainstate\\' : 'chainstate/'
    }`
  ]

  const { status, filesToFetch } = electronStore.get(
    'AppStatus.blockchain'
  )

  let downloadArray
  if (!filesToFetch) {
    const { data } = await axios({
      url: config.BLOCKCHAIN_LINK,
      method: 'get'
    })
    downloadArray = data
  } else {
    downloadArray = filesToFetch
  }
  if (status === config.BLOCKCHAIN_STATUSES.TO_FETCH) {
    fs.emptyDirSync(osPathsBlockchain[process.platform])
  }

  pathList.forEach(path => checkPath(path))
  await downloadManagerForZippedBlockchain({ data: downloadArray, source: 'blockchain' })
  electronStore.set('AppStatus.blockchain', {
    status: config.BLOCKCHAIN_STATUSES.SUCCESS,
    filesToFetch: []
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
  app.on('will-quit', () => {
    const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
    if (nodeProc && !isRescanned) {
      nodeProc.kill('SIGKILL')
    }
  })
}

let powerSleepId

const createZcashNode = async (win, torUrl) => {
  const updateStatus = electronStore.get('updateStatus')
  if (updateStatus !== config.UPDATE_STATUSES.NO_UPDATE) {
    setTimeout(() => {
      createZcashNode(win, torUrl)
    }, 5000)
    return
  }
  checkPath(osPathsBlockchain[process.platform])
  let AppStatus = electronStore.get('AppStatus')
  const vaultStatus = electronStore.get('vaultStatus')
  if (!isDev && !isFetchedFromExternalSource) {
    powerSleepId = powerSaveBlocker.start('prevent-app-suspension')
    if (!AppStatus) {
      electronStore.set('AppStatus', {
        params: {
          status: config.PARAMS_STATUSES.FETCHING
        },
        blockchain: {
          status: config.BLOCKCHAIN_STATUSES.TO_FETCH,
          isRescanned: false
        },
        fetchedSize: 0
      })
      await fetchParams(win, torUrl)
    }
    const { status: paramsStatus } = electronStore.get('AppStatus.params')
    const { status: blockchainStatus } = electronStore.get(
      'AppStatus.blockchain'
    )
    if (
      paramsStatus !== config.PARAMS_STATUSES.SUCCESS
    ) {
      await fetchParams(win, torUrl)
    }
    if (
      blockchainStatus !== config.PARAMS_STATUSES.SUCCESS &&
      vaultStatus === config.VAULT_STATUSES.CREATED
    ) {
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
        app.on('will-quit', () => {
          const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
          if (nodeProc && !isRescanned) {
            nodeProc.kill('SIGKILL')
          }
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
    app.on('will-quit', () => {
      const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
      if (nodeProc && !isRescanned) {
        nodeProc.kill('SIGKILL')
      }
    })
  }
}

app.on('ready', async () => {
  const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
  checkPath(osPathsBlockchain[process.platform])
  const blockchainFolderSize = await getFolderSizePromise(
    `${osPathsBlockchain[process.platform]}`
  )
  isFetchedFromExternalSource = blockchainFolderSize >= 26046042950 && !blockchainStatus
  electronStore.set('isBlockchainFromExternalSource', isFetchedFromExternalSource)
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
  // app.on(`browser-window-created`, (e, window) => {
  //   mainWindow.setMenu(null)
  // })
  if (process.platform === 'darwin') {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }
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
          if (mainWindow) {
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

  let rescanningInterval
  let tick = 0
  const progressBlocksArr = []

  ipcMain.on('toggle-rescanning-progress-monitor', (event, arg) => {
    if (!rescanningInterval) {
      rescanningInterval = setInterval(() => {
        findInFiles.find('rescanning', `${osPathsBlockchain[process.platform]}`, 'debug.log$')
          .then(function (results) {
            if (tick > 1) {
              const rescannedBlock = results[`${osPathsBlockchain[process.platform]}debug.log`].line.slice(-1)[0].substr(-25, 7).trim().replace('.', '')
              if (mainWindow) {
                mainWindow.webContents.send('fetchingStatus', {
                  rescannedBlock
                })
              }
              const rescannedBlockInt = parseInt(rescannedBlock)
              if (progressBlocksArr.length < 2) {
                progressBlocksArr.push(rescannedBlockInt)
              } else {
                const diff = progressBlocksArr[1] - progressBlocksArr[0]
                const timeInterval = 70
                const blockToRescan = 722000 - rescannedBlockInt
                const remainingTime = timeInterval * blockToRescan / diff
                const eta = convert(remainingTime.toFixed())
                if (mainWindow) {
                  mainWindow.webContents.send('fetchingStatus', {
                    rescannedBlock,
                    eta
                  })
                }
                progressBlocksArr.shift()
                progressBlocksArr.push(rescannedBlockInt)
              }
            }
          })
        tick++
      }, 70000)
    } else {
      console.log('clear interval')
      clearInterval(rescanningInterval)
    }
  })

  ipcMain.on('vault-created', (event, arg) => {
    electronStore.set('vaultStatus', config.VAULT_STATUSES.CREATED)
    if (!isDev && !isFetchedFromExternalSource) {
      const { status } = electronStore.get('AppStatus.blockchain')
      if (status !== config.BLOCKCHAIN_STATUSES.SUCCESS) {
        nodeProc.on('close', code => {
          setTimeout(() => {
            fetchBlockchain(mainWindow)
          }, 1000)
        })
        nodeProc.kill()
      }
    }
  })

  ipcMain.on('disable-sleep-prevention', (event, arg) => {
    powerSaveBlocker.stop(powerSleepId)
  })

  ipcMain.on('create-node', async (event, arg) => {
    let torUrl
    if (arg) {
      torUrl = arg.toString()
    }
    if (!running) {
      running = true
      if (!isDev) {
        if (!electronStore.get('username')) {
          await createRpcCredentials()
        }
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
  const vaultStatus = electronStore.get('vaultStatus')
  const shouldFullyClose = isFetchedFromExternalSource || vaultStatus !== config.VAULT_STATUSES.CREATED
  if (process.platform !== 'darwin' || shouldFullyClose) {
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
