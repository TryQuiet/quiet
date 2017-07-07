import { win } from 'os-family';
import { statSync } from 'fs';
import path from 'path';
import isAbsolute from './is-absolute';

const WIN_FILE_SCHEME = /^file:\/\/\/?/;
const FILE_SCHEME     = /^file:\/\//;


function wrapPathWithProtocol (filePath) {
    return encodeURI(`file://${ win ? '/' + filePath.replace(/\\/g, '/') : filePath}`);
}

export default function (basePath, url) {
    var urlPath = decodeURIComponent(url.replace(win ? WIN_FILE_SCHEME : FILE_SCHEME, ''));

    if (isAbsolute(urlPath))
        return wrapPathWithProtocol(path.join(urlPath));

    if (!statSync(basePath).isDirectory())
        basePath = path.dirname(basePath);

    return wrapPathWithProtocol(path.join(basePath, urlPath));
}
