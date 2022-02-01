"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUpdate = exports.isE2Etest = exports.isDev = void 0;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const electronStore_1 = __importDefault(require("../shared/electronStore"));
const electron_localshortcut_1 = __importDefault(require("electron-localshortcut"));
const debug_1 = __importDefault(require("debug"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const config_1 = __importDefault(require("./config"));
const waggleManager_1 = require("./waggleManager");
const pkijs_1 = require("pkijs");
const webcrypto_1 = require("@peculiar/webcrypto");
const log = Object.assign((0, debug_1.default)('zbay:main'), {
    error: (0, debug_1.default)('zbay:main:err')
});
electronStore_1.default.set('appDataPath', electron_1.app.getPath('appData'));
electronStore_1.default.set('waggleVersion', waggleManager_1.waggleVersion);
exports.isDev = process.env.NODE_ENV === 'development';
exports.isE2Etest = process.env.E2E_TEST === 'true';
const webcrypto = new webcrypto_1.Crypto();
const windowSize = {
    width: 800,
    height: 540
};
(0, pkijs_1.setEngine)('newEngine', webcrypto, new pkijs_1.CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle
}));
let mainWindow;
const isBrowserWindow = (window) => {
    return window instanceof electron_1.BrowserWindow;
};
const gotTheLock = electron_1.app.requestSingleInstanceLock();
const extensionsFolderPath = `${electron_1.app.getPath('userData')}/extensions`;
const applyDevTools = () => __awaiter(void 0, void 0, void 0, function* () {
    /* eslint-disable */
    if (!exports.isDev || exports.isE2Etest)
        return;
    /* eslint-disable */
    require('electron-debug')({
        showDevTools: true
    });
    const installer = require('electron-devtools-installer');
    const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
    /* eslint-enable */
    const extensionsData = [
        {
            name: REACT_DEVELOPER_TOOLS,
            path: `${extensionsFolderPath}/${REACT_DEVELOPER_TOOLS.id}`
        },
        {
            name: REDUX_DEVTOOLS,
            path: `${extensionsFolderPath}/${REDUX_DEVTOOLS.id}`
        }
    ];
    yield Promise.all(extensionsData.map((extension) => __awaiter(void 0, void 0, void 0, function* () {
        yield installer.default(extension.name);
    })));
    yield Promise.all(extensionsData.map((extension) => __awaiter(void 0, void 0, void 0, function* () {
        yield electron_1.session.defaultSession.loadExtension(extension.path, { allowFileAccess: true });
    })));
});
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', _commandLine => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
        // const url = new URL(commandLine[process.platform === 'win32' ? 3 : 1])
        // if (url.searchParams.has('invitation')) {
        //   mainWindow.webContents.send('newInvitation', {
        //     invitation: url.searchParams.get('invitation')
        //   })
        // }
        // if (url.searchParams.has('importchannel')) {
        //   mainWindow.webContents.send('newChannel', {
        //     channelParams: url.searchParams.get('importchannel')
        //   })
        // }
    });
}
electron_1.app.on('open-url', (event, url) => {
    event.preventDefault();
    const data = new URL(url);
    if (mainWindow) {
        if (data.searchParams.has('invitation')) {
            mainWindow.webContents.send('newInvitation', {
                invitation: data.searchParams.get('invitation')
            });
        }
        if (data.searchParams.has('importchannel')) {
            mainWindow.webContents.send('newChannel', {
                channelParams: data.searchParams.get('importchannel')
            });
        }
    }
});
const checkForPayloadOnStartup = (payload) => {
    const isInvitation = payload.includes('invitation');
    const isNewChannel = payload.includes('importchannel');
    if (mainWindow && (isInvitation || isNewChannel)) {
        const data = new URL(payload);
        if (data.searchParams.has('invitation')) {
            mainWindow.webContents.send('newInvitation', {
                invitation: data.searchParams.get('invitation')
            });
        }
        if (data.searchParams.has('importchannel')) {
            mainWindow.webContents.send('newChannel', {
                channelParams: data.searchParams.get('importchannel')
            });
        }
    }
};
let browserWidth;
let browserHeight;
const createWindow = () => __awaiter(void 0, void 0, void 0, function* () {
    const windowUserSize = electronStore_1.default.get('windowSize');
    mainWindow = new electron_1.BrowserWindow({
        width: windowUserSize ? windowUserSize.width : windowSize.width,
        height: windowUserSize ? windowUserSize.height : windowSize.height,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        autoHideMenuBar: true
    });
    mainWindow.setMinimumSize(600, 400);
    /* eslint-disable */
    mainWindow.loadURL(url_1.default.format({
        pathname: path_1.default.join(__dirname, './index.html'),
        protocol: 'file:',
        slashes: true,
        hash: '/'
    }));
    /* eslint-enable */
    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.on('resize', () => {
        if (isBrowserWindow(mainWindow)) {
            const [width, height] = mainWindow.getSize();
            browserHeight = height;
            browserWidth = width;
        }
    });
    electron_localshortcut_1.default.register(mainWindow, 'CommandOrControl+L', () => {
        if (isBrowserWindow(mainWindow)) {
            mainWindow.webContents.send('openLogs');
        }
    });
    electron_localshortcut_1.default.register(mainWindow, 'F12', () => {
        if (isBrowserWindow(mainWindow)) {
            mainWindow.webContents.openDevTools();
        }
    });
});
let isUpdatedStatusCheckingStarted = false;
const isNetworkError = (errorObject) => {
    return (errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
        errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
        errorObject.message === 'net::ERR_CONNECTION_RESET' ||
        errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
        errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
        errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT');
};
const checkForUpdate = (win) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isUpdatedStatusCheckingStarted) {
        try {
            yield electron_updater_1.autoUpdater.checkForUpdates();
        }
        catch (error) {
            if (isNetworkError(error)) {
                log.error('Network Error');
            }
            else {
                log.error('Unknown Error');
                log.error(error == null ? 'unknown' : (error.stack || error).toString());
            }
        }
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            log('checking for updates...');
        });
        electron_updater_1.autoUpdater.on('error', error => {
            log(error);
        });
        electron_updater_1.autoUpdater.on('update-not-available', () => {
            log('event no update');
            electronStore_1.default.set('updateStatus', config_1.default.UPDATE_STATUSES.NO_UPDATE);
        });
        electron_updater_1.autoUpdater.on('update-available', info => {
            log(info);
            electronStore_1.default.set('updateStatus', config_1.default.UPDATE_STATUSES.PROCESSING_UPDATE);
        });
        electron_updater_1.autoUpdater.on('update-downloaded', () => {
            win.webContents.send('newUpdateAvailable');
        });
        isUpdatedStatusCheckingStarted = true;
    }
    try {
        yield electron_updater_1.autoUpdater.checkForUpdates();
    }
    catch (error) {
        if (isNetworkError(error)) {
            log.error('Network Error');
        }
        else {
            log.error('Unknown Error');
            log.error(error == null ? 'unknown' : (error.stack || error).toString());
        }
    }
});
exports.checkForUpdate = checkForUpdate;
let waggleProcess = null;
electron_1.app.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    // const template = [
    //   {
    //     label: 'Zbay',
    //     submenu: [
    //       { role: 'undo' },
    //       { role: 'redo' },
    //       { type: 'separator' },
    //       { role: 'cut' },
    //       { role: 'copy' },
    //       { role: 'paste' },
    //       { role: 'pasteandmatchstyle' },
    //       { role: 'delete' },
    //       { role: 'selectall' },
    //       { type: 'separator' },
    //       { role: 'quit' }
    //     ]
    //   }
    // ]
    // app.on(`browser-window-created`, (e, window) => {
    //   mainWindow.setMenu(null)
    // })
    if (process.platform === 'darwin') {
        // const menu = Menu.buildFromTemplate(template)
        electron_1.Menu.setApplicationMenu(null);
    }
    else {
        electron_1.Menu.setApplicationMenu(null);
    }
    yield applyDevTools();
    yield createWindow();
    log('created windows');
    if (!isBrowserWindow(mainWindow)) {
        throw new Error('mainWindow is on unexpected type {mainWindow}');
    }
    mainWindow.webContents.on('did-fail-load', () => {
        log('failed loading');
    });
    mainWindow.webContents.once('did-finish-load', () => __awaiter(void 0, void 0, void 0, function* () {
        if (!isBrowserWindow(mainWindow)) {
            throw new Error('mainWindow is on unexpected type {mainWindow}');
        }
        if (process.platform === 'win32' && process.argv) {
            const payload = process.argv[1];
            if (payload) {
                checkForPayloadOnStartup(payload);
            }
        }
        if (!exports.isDev) {
            yield (0, exports.checkForUpdate)(mainWindow);
            setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                if (!isBrowserWindow(mainWindow)) {
                    throw new Error(`mainWindow is on unexpected type ${mainWindow}`);
                }
                yield (0, exports.checkForUpdate)(mainWindow);
            }), 15 * 60000);
        }
    }));
    electron_1.ipcMain.on('proceed-update', () => {
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    electron_1.ipcMain.on('start-waggle', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (waggleProcess === null || waggleProcess === void 0 ? void 0 : waggleProcess.connectionsManager.closeAllServices());
        yield (waggleProcess === null || waggleProcess === void 0 ? void 0 : waggleProcess.dataServer.close());
        waggleProcess = yield (0, waggleManager_1.runWaggle)(mainWindow.webContents);
    }));
}));
electron_1.app.setAsDefaultProtocolClient('zbay');
electron_1.app.on('before-quit', (e) => __awaiter(void 0, void 0, void 0, function* () {
    e.preventDefault();
    if (waggleProcess !== null) {
        yield waggleProcess.connectionsManager.closeAllServices();
        yield waggleProcess.dataServer.close();
    }
    if (browserWidth && browserHeight) {
        electronStore_1.default.set('windowSize', {
            width: browserWidth,
            height: browserHeight
        });
    }
    process.exit();
}));
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // NOTE: temporarly quit macos when using 'X'. Reloading the app loses the connection with waggle. To be fixed.
    electron_1.app.quit();
});
electron_1.app.on('activate', () => __awaiter(void 0, void 0, void 0, function* () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        yield createWindow();
    }
}));
