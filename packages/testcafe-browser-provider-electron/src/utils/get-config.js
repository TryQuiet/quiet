import { readFileSync, statSync } from 'fs';
import path from 'path';
import resolveFileUrl from './resolve-file-url';
import isAbsolute from './is-absolute';
import CONSTANTS from '../constants';


const PROTOCOL_RE = /^([\w-]+?)(?=\:\/\/)/;

export default function (mainPath) {
    var configDir = '';

    if (statSync(mainPath).isDirectory())
        configDir = mainPath;
    else
        configDir = path.dirname(mainPath);

    var configPath   = path.join(configDir, CONSTANTS.configFileName);
    var configString = readFileSync(configPath).toString();

    var config = JSON.parse(configString);

    if (!config.appPath)
        config.appPath = mainPath;
    else if (!isAbsolute(config.appPath))
        config.appPath = path.resolve(configDir, config.appPath);

    if (config.mainWindowUrl.indexOf('file:') === 0 || !PROTOCOL_RE.test(config.mainWindowUrl))
        config.mainWindowUrl = resolveFileUrl(config.mainWindowUrl, mainPath);

    return config;
}
