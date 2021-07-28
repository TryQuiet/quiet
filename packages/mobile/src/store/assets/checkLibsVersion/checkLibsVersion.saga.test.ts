import Config from 'react-native-config';
import { DocumentDirectoryPath, exists } from 'react-native-fs';
import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { fork, call, take } from 'redux-saga-test-plan/matchers';
import {
  downloadAssets,
  md5Check,
} from '../../../utils/functions/downloadAssets/downloadAssets';
import { initReducer, InitState } from '../../init/init.slice';
import { waitForNavigatorSaga } from '../../init/waitForNavigator/waitForNavigator.saga';
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
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer, [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
        [StoreKeys.Init]: {
          ...new InitState(),
        }
      })
      .provide([
        [fork(waitForNavigatorSaga), null],
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
        },
        [StoreKeys.Init]: {
          ...new InitState(),
          initDescription: 'Downloading libraries with power to keep you safe',
        }
      })
      .run();
  });
});
