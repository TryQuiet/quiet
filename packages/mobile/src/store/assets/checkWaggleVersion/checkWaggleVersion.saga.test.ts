import Config from 'react-native-config';
import { DocumentDirectoryPath, exists } from 'react-native-fs';
import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { fork, call, take } from 'redux-saga-test-plan/matchers';
import {
  downloadAssets,
  md5Check,
} from '../../../utils/functions/downloadAssets/downloadAssets';
import { initActions, initReducer, InitState } from '../../init/init.slice';
import { waitForNavigatorSaga } from '../../init/waitForNavigator/waitForNavigator.saga';
import { StoreKeys } from '../../store.keys';
import { assetsActions, assetsReducer, AssetsState } from '../assets.slice';
import { checkWaggleVersionSaga } from './checkWaggleVersion.saga';

describe('checkWaggleVersionSaga', () => {
  const downloadChannel = jest.fn();

  test('skip updating waggle', async () => {
    await expectSaga(checkWaggleVersionSaga)
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentWaggleVersion: Config.WAGGLE_VERSION,
        },
      })
      .hasFinalState({
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentWaggleVersion: Config.WAGGLE_VERSION,
        },
      })
      .run();
  });
  test('update waggle', async () => {
    await expectSaga(checkWaggleVersionSaga)
      .withReducer(combineReducers({ [StoreKeys.Assets]: assetsReducer, [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Assets]: {
          ...new AssetsState(),
        },
        [StoreKeys.Init]: {
          ...new InitState(),
        },
      })
      .provide([
        [fork(waitForNavigatorSaga), null],
        [call.fn(downloadAssets), downloadChannel],
        [take(downloadChannel), assetsActions.setDownloadCompleted()],
        [
          call(
            md5Check,
            `${DocumentDirectoryPath}/waggle.zip`,
            Config.WAGGLE_MD5,
          ),
          true,
        ],
        [call.fn(exists), true],
      ])
      .put(
        initActions.updateInitDescription(
          'Downloading tools to protect your privacy',
        ),
      )
      .put(assetsActions.setCurrentWaggleVersion(Config.WAGGLE_VERSION))
      .hasFinalState({
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentWaggleVersion: Config.LIBS_VERSION,
        },
        [StoreKeys.Init]: {
          ...new InitState(),
          initDescription: 'Downloading tools to protect your privacy',
        }
      })
      .run();
  });
});
