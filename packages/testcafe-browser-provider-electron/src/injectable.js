import vm from 'vm';
import resolveFileUrl from './utils/resolve-file-url';

import MESSAGES from './messages';
import CONSTANTS from './constants';


const URL_QUERY_RE      = /\?.*$/;
const NAVIGATION_EVENTS = ['will-navigate', 'did-navigate'];


function install (config, testPageUrl) {
    var { BrowserWindow, Menu, ipcMain, dialog } = require('electron');

    var { WebContents } = process.atomBinding('web_contents');

    var origLoadURL = BrowserWindow.prototype.loadURL;

    var electronDialogsHandler = null;

    global[CONSTANTS.contextMenuGlobal] = null;

    function stripQuery (url) {
        return url.replace(URL_QUERY_RE, '');
    }

    BrowserWindow.prototype.loadURL = function (url) {
        var testUrl = stripQuery(url);

        if (url.indexOf('file:') === 0)
            testUrl = resolveFileUrl(config.appPath, testUrl);

        if (testUrl.toLowerCase() === config.mainWindowUrl.toLowerCase()) {
            BrowserWindow.prototype.loadURL = origLoadURL;

            url = testPageUrl;

            if (config.openDevTools)
                this.webContents.openDevTools();
        }

        return origLoadURL.call(this, url);
    };

    Menu.prototype.popup = function () {
        global[CONSTANTS.contextMenuGlobal] = this;
    };

    Menu.prototype.closePopup = function () {
        global[CONSTANTS.contextMenuGlobal] = null;
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

    process.argv.splice(1, 2);
}

module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        if (args[2]) {
            if (config.appPath)
                args[0] = config.appPath;
            else
                config.appPath = require.resolve(args[0]);

            install(config, testPageUrl);
            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};

