import Config from 'react-native-config';
import { DocumentDirectoryPath, exists } from 'react-native-fs';
import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { call, take } from 'redux-saga-test-plan/matchers';
import {
  downloadAssets,
  md5Check,
} from '../../../utils/functions/downloadAssets/downloadAssets';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { StoreKeys } from '../../store.keys';
import { assetsActions, assetsReducer, AssetsState } from '../assets.slice';
import { checkLibsVersionSaga } from './checkLibsVersion.saga';

describe('checkLibsVersionSaga', () => {
  const downloadChannel = jest.fn();

  test('skip updating libs', async () => {
    await expectSaga(checkLibsVersionSaga)
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentLibsVersion: Config.LIBS_VERSION,
        },
      })
      .hasFinalState({
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentLibsVersion: Config.LIBS_VERSION,
        },
      })
      .run();
  });
  test('update libs', async () => {
    await expectSaga(checkLibsVersionSaga)
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
      })
      .provide([
        [call.fn(navigateTo), null],
        [call.fn(downloadAssets), downloadChannel],
        [take(downloadChannel), assetsActions.setDownloadCompleted()],
        [
          call(md5Check, `${DocumentDirectoryPath}/libs.zip`, Config.LIBS_MD5),
          true,
        ],
        [call.fn(exists), true],
      ])
      .hasFinalState({
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentLibsVersion: Config.LIBS_VERSION,
          downloadHint: 'Downloading libraries with power to keep you safe',
        },
      })
      .run();
  });
});
