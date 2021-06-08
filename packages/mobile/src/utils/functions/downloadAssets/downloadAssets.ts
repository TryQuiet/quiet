import { eventChannel } from '@redux-saga/core';
import { downloadFile, hash } from 'react-native-fs';
import { assetsActions } from '../../../store/assets/assets.slice';
import { END } from 'redux-saga';

export const downloadAssets = (url: string, path: string) => {
  return eventChannel<
    | ReturnType<typeof assetsActions.setDownloadProgress>
    | ReturnType<typeof assetsActions.setDownloadCompleted>
    | ReturnType<typeof assetsActions.setDownloadError>
  >(emit => {
    (async () => {
      const download = downloadFile({
        fromUrl: url,
        toFile: path,
        background: true,
        progressDivider: 1,
        progress: data => {
          const percentage = (100 * data.bytesWritten) / data.contentLength;
          emit(assetsActions.setDownloadProgress(percentage));
        },
      });

      const downloadResult = await download.promise;

      if (downloadResult.statusCode === 200) {
        emit(assetsActions.setDownloadCompleted());
      } else {
        emit(
          assetsActions.setDownloadError(
            `Could not download files. Download result status code is ${downloadResult.statusCode}`,
          ),
        );
      }

      emit(END);
    })();
    return () => {};
  });
};

export const md5Check = async (path: string, expected: string) => {
  const actual = await hash(path, 'md5');
  return JSON.stringify(actual) === JSON.stringify(expected);
};
