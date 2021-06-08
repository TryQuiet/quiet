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
        assetsActions.setDownloadHint(
          'Downloading tools to protect your privacy',
        ),
      )
      .put(assetsActions.setCurrentWaggleVersion(Config.WAGGLE_VERSION))
      .hasFinalState({
        [StoreKeys.Assets]: {
          ...new AssetsState(),
          currentWaggleVersion: Config.LIBS_VERSION,
          downloadHint: 'Downloading tools to protect your privacy',
        },
      })
      .run();
  });
});
