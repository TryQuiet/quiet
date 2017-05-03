import { win } from 'os-family';
import { statSync } from 'fs';
import path from 'path';
import isAbsolute from './is-absolute';


function wrapPathWithProtocol (filePath) {
    return `file://${ win ? '/' + filePath.toLowerCase().replace(/\\/g, '/') : filePath}`;
}

export default function (url, appPath) {
    var urlPath = decodeURIComponent(url.replace(win ? /^file:\/\/\/?/ : /^file:\/\//, ''));

    if (isAbsolute(urlPath))
        return wrapPathWithProtocol(path.join(urlPath));

    if (!statSync(appPath).isDirectory())
        appPath = path.dirname(appPath);

    return wrapPathWithProtocol(path.join(appPath, urlPath));
}
