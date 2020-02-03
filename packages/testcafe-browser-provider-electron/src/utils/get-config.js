import { readFileSync, statSync, existsSync } from 'fs';
import path from 'path';
import resolveFileUrl from './resolve-file-url';
import isAbsolute from './is-absolute';
import CONSTANTS from '../constants';


const PROTOCOL_RE = /^([\w-]+?)(?=\:\/\/)/;

export default function (id, mainPath) {
    let configPath = mainPath;
    let config;
    let mainDir;

    if (statSync(mainPath).isDirectory()) {
        mainDir = mainPath;

        const allowedExtensions = [ '.js', '.json' ];

        // get first allowed extension config file that exists.
        allowedExtensions.some( ext => {
            const possibleConfig = path.join(mainPath, CONSTANTS.configFileName + ext );

            const exists = existsSync( possibleConfig );

            if ( exists )
                configPath = possibleConfig;

            return exists;
        });
    }

    mainDir = mainDir || path.dirname(mainPath);

    // check if we have a specific ext and can use require.
    if ( path.extname( configPath ) ) 
        config = require( configPath );
    
    else {
        // fall back to .testcafe-electron-rc file w/ no extension
        const configString = readFileSync(path.join(mainPath, CONSTANTS.configFileName )).toString();

        config = JSON.parse(configString);
    }

    if (config.appPath && !isAbsolute(config.appPath))
        config.appPath = path.resolve(mainDir, config.appPath);

    if (config.electronPath) {
        if (!isAbsolute(config.electronPath))
            config.electronPath = path.resolve(mainDir, config.electronPath);
        else
            config.electronPath = path.resolve(config.electronPath);
    }
    else
        config.electronPath = require('electron');

    if (config.mainWindowUrl.indexOf('file:') === 0 || !PROTOCOL_RE.test(config.mainWindowUrl))
        config.mainWindowUrl = resolveFileUrl(mainDir, config.mainWindowUrl);

    config.serverId = 'testcafe-electron-server-' + id;
    config.clientId = 'testcafe-electron-client-' + id;

    return config;
}
