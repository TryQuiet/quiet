import { DocumentDirectoryPath, exists, unlink } from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { call, put, take } from 'typed-redux-saga';
import {
  downloadAssets,
  md5Check,
} from '../../../utils/functions/downloadAssets/downloadAssets';
import { getSupportedAbi } from '../../../utils/functions/getSupportedAbi/getSupportedAbi';
import { assetsActions } from '../assets.slice';

export function* startDownload(
  s3: string,
  asset: string,
  version: string,
  md5sum: string,
): Generator {
  const abi = yield* call(getSupportedAbi);
  const url = s3 + '/' + version + '/' + abi + '/' + asset + '.zip';
  const path = DocumentDirectoryPath + '/' + asset + '.zip';

  // Get rid of outdated assets
  const unzipped = path.replace(/\.[^/.]+$/, '');
  yield* unlinkAssets(unzipped);

  const downloadChannel = yield* call(downloadAssets, url, path);

  while (true) {
    const action = yield* take(downloadChannel);

    if (action.type === assetsActions.setDownloadCompleted.type) {
      const sum = yield* call(md5Check, path, md5sum);
      if (sum) {
        yield* completeDownload(path);
        break;
      } else {
        throw new Error(
          "Invalid md5sum. Looks like you're trying to download wrong file. Make sure your internet connection can be trusted.",
        );
      }
    } else if (action.type === assetsActions.setDownloadError.type) {
      throw new Error(action.payload as string);
    } else {
      yield* put(action);
    }
  }
}

export function* unzipAssets(path: string): Generator {
  const destination = DocumentDirectoryPath + '/';
  yield* call(unzip, path, destination);
}

export function* unlinkAssets(path: string): Generator {
  const areAssetsPresent = yield* call(exists, path);
  if (areAssetsPresent) {
    yield* call(unlink, path);
  }
}

export function* completeDownload(path: string): Generator {
  yield* unzipAssets(path);
  yield* unlinkAssets(path);
}
