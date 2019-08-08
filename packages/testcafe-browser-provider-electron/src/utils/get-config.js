import { readFileSync, statSync } from 'fs';
import path from 'path';
import resolveFileUrl from './resolve-file-url';
import isAbsolute from './is-absolute';
import CONSTANTS from '../constants';


const PROTOCOL_RE = /^([\w-]+?)(?=\:\/\/)/;

export default function (id, mainPath) {
    if (statSync(mainPath).isDirectory())
        mainPath = path.join(mainPath, CONSTANTS.configFileName);

    var mainDir      = path.dirname(mainPath);
    var configString = readFileSync(mainPath).toString();

    var config = JSON.parse(configString);

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
