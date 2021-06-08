import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import { startDownload } from './manageDownload.saga';
import { assetsActions, assetsReducer, AssetsState } from '../assets.slice';
import Config from 'react-native-config';
import {
  downloadAssets,
  md5Check,
} from '../../../utils/functions/downloadAssets/downloadAssets';
import { DocumentDirectoryPath, exists, unlink } from 'react-native-fs';
import { call, take } from 'redux-saga-test-plan/matchers';
import { unzip } from 'react-native-zip-archive';

describe('manageDownloadSaga', () => {
  const downloadChannel = jest.fn();

  test('download and unpack assets', async () => {
    await expectSaga(
      startDownload,
      Config.S3,
      'libs',
      Config.LIBS_VERSION,
      Config.LIBS_MD5,
    )
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
      })
      .provide([
        [call.fn(downloadAssets), downloadChannel],
        [take(downloadChannel), assetsActions.setDownloadCompleted()],
        [
          call(md5Check, `${DocumentDirectoryPath}/libs.zip`, Config.LIBS_MD5),
          true,
        ],
        [call.fn(exists), true],
      ])
      .call(
        downloadAssets,
        `${Config.S3}/${Config.LIBS_VERSION}/arm64-v8a/libs.zip`,
        `${DocumentDirectoryPath}/libs.zip`,
      )
      .call(
        unzip,
        `${DocumentDirectoryPath}/libs.zip`,
        `${DocumentDirectoryPath}/`,
      )
      .call(unlink, `${DocumentDirectoryPath}/libs.zip`)
      .run();
  });

  test('fail at md5sum', async () => {
    await expectSaga(
      startDownload,
      Config.S3,
      'libs',
      Config.LIBS_VERSION,
      Config.LIBS_MD5,
    )
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
      })
      .provide([
        [call.fn(downloadAssets), downloadChannel],
        [take(downloadChannel), assetsActions.setDownloadCompleted()],
        [
          call(md5Check, `${DocumentDirectoryPath}/libs.zip`, Config.LIBS_MD5),
          false,
        ],
      ])
      .throws(
        Error(
          "Invalid md5sum. Looks like you're trying to download wrong file. Make sure your internet connection can be trusted.",
        ),
      )
      .run();
  });

  test('fail at download', async () => {
    await expectSaga(
      startDownload,
      Config.S3,
      'libs',
      Config.LIBS_VERSION,
      Config.LIBS_MD5,
    )
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
      })
      .provide([
        [call.fn(downloadAssets), downloadChannel],
        [take(downloadChannel), assetsActions.setDownloadError('error')],
      ])
      .throws(Error('error'))
      .run();
  });
});
