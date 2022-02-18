import { sep } from 'path';


const ELECTRON_BROWSER_INIT_PATHS = [
    'electron/js2c/browser_init', // NOTE: >= Electron v7.0.0
    ['electron.asar', 'browser', 'init.js'].join(sep) // NOTE: <= Electron v6.1.5
];

function isBrowserInitModule (path) {
    return ELECTRON_BROWSER_INIT_PATHS.some(initPath => path.endsWith(initPath));
}

module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        const isMain                     = args[2];
        const isNotBrowserInitMainModule = isMain && !isBrowserInitModule(args[0]);

        if (isNotBrowserInitMainModule) {
            if (config.appPath) {
                config.appEntryPoint = require.resolve(config.appPath);

                args[0] = config.appEntryPoint;
            }
            else
                config.appEntryPoint = require.resolve(args[0]);

            var installElectronMocks = require('./electron-mocks');

            installElectronMocks(config, testPageUrl);

            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};
