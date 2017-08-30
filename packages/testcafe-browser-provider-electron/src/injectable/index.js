module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        if (args[2]) {
            if (config.appPath)
                args[0] = config.appPath;
            else
                config.appPath = require.resolve(args[0]);

            var installElectronMocks = require('./electron-mocks');

            installElectronMocks(config, testPageUrl);

            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};
