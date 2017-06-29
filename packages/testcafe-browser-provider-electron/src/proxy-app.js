import OS from 'os-family';
import { BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import Module from 'module';
import vm from 'vm';
import getConfig from './utils/get-config';
import resolveFileUrl from './utils/resolve-file-url';
import MESSAGES from './messages';
import CONSTANTS from './constants';

const { WebContents } = process.atomBinding('web_contents');

const NAVIGATION_EVENTS   = ['will-navigate', 'did-navigate'];

var mainPath    = process.env[CONSTANTS.mainPathEnv];
var testPageURL = process.env[CONSTANTS.testUrlEnv];

var config         = getConfig(mainPath);
var origLoadURL    = BrowserWindow.prototype.loadURL;

var electronDialogsHandler = null;

global[CONSTANTS.contextMenuGlobal] = null;

function refineUrl (url) {
    if (OS.win)
        url = url.replace(/$file:\/\/(\w)/, 'file:///$1').toLowerCase();
    else if (OS.mac)
        url = url.toLowerCase();


    return url.replace(/\?.*$/, '');
}

BrowserWindow.prototype.loadURL = function (url) {
    var testUrl = refineUrl(url);

    if (url.indexOf('file:') === 0)
        testUrl = resolveFileUrl(testUrl, config.appPath);

    if (testUrl === config.mainWindowUrl) {
        BrowserWindow.prototype.loadURL = origLoadURL;

        url = testPageURL;

        if (config.openDevTools)
            this.webContents.openDevTools();
    }

    return origLoadURL.call(this, url);
};

Menu.prototype.popup = function () {
    global[CONSTANTS.contextMenuGlobal] = this;
};

Menu.prototype.closePopup = function () {
    global[CONSTANTS.contextMenuGlobal]  = null;
};

if (!config.enableNavigateEvents) {
    var origOn = WebContents.prototype.on;

    WebContents.prototype.on = function (event, listener) {
        if (NAVIGATION_EVENTS.indexOf(event) > -1)
            return;

        origOn.call(this, event, listener);
    };
}

function handleDialog (type, args) {
    if (!electronDialogsHandler)
        return void 0;

    var handlerResult = electronDialogsHandler(type, ...args);
    var lastArg       = args.length ? args[args.length - 1] : null;

    if (typeof lastArg === 'function')
        lastArg(handlerResult);

    return handlerResult;
}

ipcMain.on(MESSAGES.setHandler, (event, arg) => {
    electronDialogsHandler = arg ? vm.runInNewContext(`(${arg.fn})`, arg.ctx || {}) : null;
});

dialog.showOpenDialog = (...args) => handleDialog('open-dialog', args);

dialog.showSaveDialog = (...args) => handleDialog('save-dialog', args);

dialog.showMessageBox = (...args) => handleDialog('message-box', args);

dialog.showErrorBox = (...args) => handleDialog('error-box', args);

dialog.showCertificateTrustDialog = (...args) => handleDialog('certificate-trust-dialog', args);

if (config.appArgs)
    Object.assign(process.argv, config.appArgs);

Module._load(config.appPath, null, true);

