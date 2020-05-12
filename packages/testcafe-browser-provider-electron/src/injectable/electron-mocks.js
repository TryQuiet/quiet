import { Client } from '../ipc';
import resolveFileUrl from '../utils/resolve-file-url';
import CONSTANTS from '../constants';

const ELECTRON_VERSION  = process.versions.electron && Number(process.versions.electron.split('.')[0]);

const ELECTRON_VERSION_WITH_ASYNC_LOAD_URL = 5;

const URL_QUERY_RE      = /\?.*$/;
const NAVIGATION_EVENTS = ['will-navigate', 'did-navigate'];

var ipc                = null;
var loadingTimeout     = null;
var openedUrls         = [];
var contextMenuHandler = { menu: null };
var windowHandler      = { window: null };

var dialogHandler = {
    fn:                   null,
    handledDialog:        false,
    hadUnexpectedDialogs: false,
    hadNoExpectedDialogs: false
};

function startLoadingTimeout () {
    if (loadingTimeout)
        return;

    loadingTimeout = setTimeout(() => {
        ipc.sendInjectingStatus({ completed: false, openedUrls });
    }, CONSTANTS.loadingTimeout);
}

function stopLoadingTimeout () {
    clearTimeout(loadingTimeout);

    loadingTimeout = 0;
}

function handleDialog (type, args) {
    if (!dialogHandler.fn) {
        dialogHandler.hadUnexpectedDialogs = true;
        return void 0;
    }

    dialogHandler.handledDialog = true;

    var handlerFunction = dialogHandler.fn;
    var handlerResult   = handlerFunction(type, ...args);
    var lastArg         = args.length ? args[args.length - 1] : null;

    if (typeof lastArg === 'function')
        lastArg(handlerResult);

    return handlerResult;
}

module.exports = function install (config, testPageUrl) {
    ipc = new Client(config, { dialogHandler, contextMenuHandler, windowHandler });

    const ipcConnectionPromise = ipc.connect();
    
    var { Menu, dialog, app } = require('electron');

    var WebContents;

    if ( process.atomBinding ) {
        // NOTE: < Electron 6
        WebContents = process.atomBinding('web_contents').WebContents;
    }
    else {
        // NOTE: >= Electron 6
        WebContents = process.electronBinding('web_contents').WebContents;
    }


    var origLoadURL = WebContents.prototype.loadURL;

    var origGetAppPath = app.getAppPath;

    function stripQuery (url) {
        return url.replace(URL_QUERY_RE, '');
    }

    function isFileProtocol (url) {
        return url.indexOf('file:') === 0;
    }

    function loadUrl (webContext, url, options) {
        let testUrl = stripQuery(url);

        if (isFileProtocol(url))
            testUrl = resolveFileUrl(config.appEntryPoint, testUrl);

        openedUrls.push(testUrl);

        if (testUrl.toLowerCase() === config.mainWindowUrl.toLowerCase()) {
            stopLoadingTimeout();

            ipc.sendInjectingStatus({ completed: true });

            WebContents.prototype.loadURL = origLoadURL;

            url = testPageUrl;

            windowHandler.window = this;

            if (config.openDevTools)
                webContext.openDevTools();
        }

        return origLoadURL.call(webContext, url, options);
    }

    WebContents.prototype.loadURL = function (url, options) {
        startLoadingTimeout(config.mainWindowUrl);

        if (ELECTRON_VERSION >= ELECTRON_VERSION_WITH_ASYNC_LOAD_URL)
            return ipcConnectionPromise.then(() => loadUrl(this, url, options));

        return loadUrl(this, url, options);
    };

    app.getAppPath = function () {
        return config.appPath || origGetAppPath.call(this);
    };

    Menu.prototype.popup = function () {
        contextMenuHandler.menu = this;
    };

    Menu.prototype.closePopup = function () {
        contextMenuHandler.menu = null;
    };

    if (!config.enableNavigateEvents) {
        var origOn = WebContents.prototype.on;

        WebContents.prototype.on = function (event, listener) {
            if (NAVIGATION_EVENTS.indexOf(event) > -1)
                return;

            origOn.call(this, event, listener);
        };
    }

    dialog.showOpenDialog = (...args) => handleDialog('open-dialog', args);

    dialog.showSaveDialog = (...args) => handleDialog('save-dialog', args);

    dialog.showMessageBox = (...args) => handleDialog('message-box', args);

    dialog.showErrorBox = (...args) => handleDialog('error-box', args);

    dialog.showCertificateTrustDialog = (...args) => handleDialog('certificate-trust-dialog', args);

    process.argv.splice(1, 2);
};
