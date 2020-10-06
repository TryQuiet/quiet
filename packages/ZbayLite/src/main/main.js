import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import electronLocalshortcut from 'electron-localshortcut'
import path from 'path'
import url from 'url'
import { autoUpdater } from 'electron-updater'
// import readLastLines from 'read-last-lines'
import find from 'find-process'
import ps from 'ps-node'
import util from 'util'

import config from './config'
import { spawnZcashNode } from './zcash/bootstrap'
import electronStore from '../shared/electronStore'
import Client from './cli/client'
import websockets from './websockets/client'
import { createServer } from './websockets/server'
import { spawnTor, getOnionAddress } from '../../tor'

const _killProcess = util.promisify(ps.kill)

// const osPathsBlockchainDefault = {
//   darwin: `${process.env.HOME ||
//     process.env.USERPROFILE}/Library/Application Support/Zcash/`,
//   linux: `${process.env.HOME || process.env.USERPROFILE}/.zcash/`,
//   win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zcash\\`
// }

// const osPathLogs = {
//   darwin: `${process.env.HOME ||
//     process.env.USERPROFILE}/Library/Application Support/Zbay/Logs/`,
//   linux: `${process.env.HOME || process.env.USERPROFILE}/.config/Zbay/Logs/`,
//   win32: `${os.userInfo().homedir}\\AppData\\Roaming\\Zbay\\Logs\\`
// }

let isFetchedFromExternalSource = false

const isTestnet = parseInt(process.env.ZBAY_IS_TESTNET)
let nodeProc = null

export const isDev = process.env.NODE_ENV === 'development'
const installExtensions = async () => {
  if (!isDev) return
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
  width: 800,
  height: 540
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
    const url = new URL(commandLine[process.platform === 'win32' ? 3 : 1])
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

const checkForPayloadOnStartup = payload => {
  const isInvitation = payload.includes('invitation')
  const isNewChannel = payload.includes('importchannel')
  if (mainWindow && (isInvitation || isNewChannel)) {
    const data = new URL(payload)
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
}

let browserWidth
let browserHeight
const createWindow = () => {
  const windowUserSize = electronStore.get('windowSize')
  mainWindow = new BrowserWindow({
    width: windowUserSize ? windowUserSize.width : windowSize.width,
    height: windowUserSize ? windowUserSize.height : windowSize.height,
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
      hash: '/zcashNode'
    })
  )

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize()
    browserHeight = height
    browserWidth = width
  })
  electronLocalshortcut.register(mainWindow, 'F11', () => {
    mainWindow.webContents.send('toggleCoordinator', {})
  })
  electronLocalshortcut.register(mainWindow, 'CommandOrControl+L', () => {
    mainWindow.webContents.send('openLogs')
  })
  electronLocalshortcut.register(mainWindow, 'F12', () => {
    mainWindow.toggleDevTools()
  })
}

let isUpdatedStatusCheckingStarted = false

export const checkForUpdate = win => {
  if (!isUpdatedStatusCheckingStarted) {
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
      electronStore.set(
        'updateStatus',
        config.UPDATE_STATUSES.PROCESSING_UPDATE
      )
    })

    autoUpdater.on('update-downloaded', info => {
      const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
      const paramsStatus = electronStore.get('AppStatus.params.status')
      if (
        blockchainStatus !== config.BLOCKCHAIN_STATUSES.SUCCESS ||
        paramsStatus !== config.PARAMS_STATUSES.SUCCESS
      ) {
        autoUpdater.quitAndInstall()
      } else {
        win.webContents.send('newUpdateAvailable')
      }
    })
    isUpdatedStatusCheckingStarted = true
  }
  autoUpdater.checkForUpdates()
}

const killZcashdProcess = async () => {
  const zcashProcess = await find('name', 'zcashd')
  if (zcashProcess.length > 0) {
    const [processDetails] = zcashProcess
    const { pid } = processDetails
    await _killProcess(pid)
  }
}

const checkZcashdStatus = async () => {
  const isBlockchainRescanned = electronStore.get(
    'AppStatus.blockchain.isRescanned'
  )
  if (mainWindow && isBlockchainRescanned && !isDev) {
    const zcashProcess = await find('name', 'zcashd')
    if (zcashProcess.length > 0) {
      mainWindow.webContents.send('checkNodeStatus', {
        status: 'up'
      })
    } else {
      mainWindow.webContents.send('checkNodeStatus', {
        status: 'down'
      })
    }
  }
  setTimeout(checkZcashdStatus, 1200000)
}

setTimeout(() => {
  const isBlockchainRescanned = electronStore.get(
    'AppStatus.blockchain.isRescanned'
  )
  if (isBlockchainRescanned && !isDev) {
    checkZcashdStatus()
  }
}, 1200000)

ipcMain.on('restart-node-proc', async (event, arg) => {
  await killZcashdProcess()
  spawnZcashNode(process.platform, isTestnet)
})

let client
let torProcess = null
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

  // app.on(`browser-window-created`, (e, window) => {
  //   mainWindow.setMenu(null)
  // })
  if (process.platform === 'darwin') {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }

  await installExtensions()

  createWindow()
  mainWindow.webContents.on('did-finish-load', async () => {
    mainWindow.webContents.send('ping')
    try {
      torProcess = await spawnTor()
      createServer(mainWindow)
      mainWindow.webContents.send('onionAddress', getOnionAddress())
    } catch (error) {
      console.log(error)
    }
    if (process.platform === 'win32' && process.argv) {
      const payload = process.argv[1]
      if (payload) {
        checkForPayloadOnStartup(payload)
      }
    }
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
  client = new Client()
  ipcMain.on('rpcQuery', async (event, arg) => {
    const request = JSON.parse(arg)
    const response = await client.postMessage(
      request.id,
      request.method,
      request.args
    )
    mainWindow.webContents.send(
      'rpcQuery',
      JSON.stringify({ id: request.id, data: response })
    )
  })

  ipcMain.on('sendWebsocket', async (event, arg) => {
    const request = JSON.parse(arg)
    const response = await websockets.handleSend(request)
    // const response = await client.postMessage(request.id, request.method, request.args)
    mainWindow.webContents.send(
      'sendWebsocket',
      JSON.stringify({ id: request.id, response: response })
    )
  })

  ipcMain.on('vault-created', (event, arg) => {
    electronStore.set('vaultStatus', config.VAULT_STATUSES.CREATED)
    // const blockchainConfiguration = electronStore.get('blockchainConfiguration')
    // if (!isDev && (!isFetchedFromExternalSource || blockchainConfiguration === config.BLOCKCHAIN_STATUSES.TO_FETCH)) {
    //   const { status } = electronStore.get('AppStatus.blockchain')
    //   if (status !== config.BLOCKCHAIN_STATUSES.SUCCESS) {
    //     nodeProc.on('close', code => {
    //       setTimeout(() => {
    //         createZcashNode(mainWindow)
    //       }, 1000)
    //     })
    //     nodeProc.kill()
    //   }
    // }
  })

  ipcMain.on('proceed-with-syncing', (event, userChoice) => {
    if (userChoice === 'EXISTING') {
      electronStore.set(
        'blockchainConfiguration',
        config.BLOCKCHAIN_STATUSES.DEFAULT_LOCATION_SELECTED
      )
    } else {
      electronStore.set(
        'blockchainConfiguration',
        config.BLOCKCHAIN_STATUSES.TO_FETCH
      )
    }
  })

  // let loadLogsInterval
  // const checkLogsFiles = () => {
  //   const blockchainConfiguration = electronStore.get('blockchainConfiguration')
  //   const targetPath = {
  //     transactions: `${osPathLogs[process.platform]}transactions.json`,
  //     debug: blockchainConfiguration === config.BLOCKCHAIN_STATUSES.TO_FETCH ? `${osPathsBlockchainCustom[process.platform]}debug.log`
  //       : `${osPathsBlockchainDefault[process.platform]}debug.log`,
  //     rpcCalls: `${osPathLogs[process.platform]}rpcCalls.json`
  //   }
  //   const isTransactionFileExists = fs.existsSync(targetPath.transactions)
  //   const isRpcCallsFileExists = fs.existsSync(targetPath.rpcCalls)
  //   const createJsonFormatFile = (path) => fs.writeFileSync(path, JSON.stringify([]))
  //   if (!isTransactionFileExists) {
  //     createJsonFormatFile(targetPath.transactions)
  //   }
  //   if (!isRpcCallsFileExists) {
  //     createJsonFormatFile(targetPath.rpcCalls)
  //   }
  // }

  // const loadLogs = async () => {
  //   const blockchainConfiguration = electronStore.get('blockchainConfiguration')
  //   const targetPath = {
  //     transactions: `${osPathLogs[process.platform]}transactions.json`,
  //     debug: blockchainConfiguration === config.BLOCKCHAIN_STATUSES.TO_FETCH ? `${osPathsBlockchainCustom[process.platform]}debug.log`
  //       : `${osPathsBlockchainDefault[process.platform]}debug.log`,
  //     rpcCalls: `${osPathLogs[process.platform]}rpcCalls.json`
  //   }
  //   checkPath(osPathLogs[process.platform])
  //   checkLogsFiles()
  //   const transactions = JSON.parse(fs.readFileSync(targetPath.transactions))
  //   let applicationLogs = JSON.parse(fs.readFileSync(targetPath.rpcCalls))
  //   if (applicationLogs.length > 100) {
  //     const startHeight = applicationLogs.length - 100
  //     applicationLogs = applicationLogs.slice(startHeight, applicationLogs.length)
  //   }
  //   const debugFileLines = await readLastLines.read(targetPath.debug, 100)
  //   if (mainWindow) {
  //     mainWindow.webContents.send('load-logs-to-store', {
  //       debug: debugFileLines.split('\n'),
  //       transactions,
  //       applicationLogs
  //     })
  //   }
  // }

  ipcMain.on('load-logs', (event, type) => {
    return false
  })

  // ipcMain.on('disable-load-logs', (event) => {
  //   if (loadLogsInterval) {
  //     clearInterval(loadLogsInterval)
  //     loadLogsInterval = null
  //   }
  // })

  ipcMain.on('save-to-log-file', (event, { type, payload }) => {
    return false
    // checkPath(osPathLogs[process.platform])
    // checkLogsFiles()
    // const blockchainConfiguration = electronStore.get('blockchainConfiguration')
    // const targetPath = {
    //   transactions: `${osPathLogs[process.platform]}transactions.json`,
    //   debug: blockchainConfiguration === config.BLOCKCHAIN_STATUSES.TO_FETCH ? `${osPathsBlockchainCustom[process.platform]}debug.log`
    //     : `${osPathsBlockchainDefault[process.platform]}debug.log`,
    //   rpcCalls: `${osPathLogs[process.platform]}rpcCalls.json`
    // }
    // if (type === 'TRANSACTION') {
    //   const transactions = JSON.parse(fs.readFileSync(targetPath.transactions))
    //   transactions.push(payload)
    //   fs.writeFileSync(targetPath.transactions, JSON.stringify(transactions))
    // } else {
    //   const applicationLogs = JSON.parse(fs.readFileSync(targetPath.rpcCalls))
    //   applicationLogs.push(payload)
    //   fs.writeFileSync(targetPath.rpcCalls, JSON.stringify(applicationLogs))
    // }
  })

  ipcMain.on('create-node', async (event, arg) => {
    let torUrl
    if (arg) {
      torUrl = arg.toString()
    }
    if (!running) {
      running = true
      console.log(torUrl)
    }
  })
})

app.setAsDefaultProtocolClient('zbay')

process.on('exit', () => {
  if (nodeProc !== null) {
    nodeProc.kill()
  }
})

app.on('before-quit', async e => {
  if (torProcess !== null) {
    torProcess.kill()
  }
  await client.terminate()
  if (browserWidth && browserHeight) {
    electronStore.set('windowSize', {
      width: browserWidth,
      height: browserHeight
    })
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  const vaultStatus = electronStore.get('vaultStatus')
  const shouldFullyClose =
    isFetchedFromExternalSource || vaultStatus !== config.VAULT_STATUSES.CREATED
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
