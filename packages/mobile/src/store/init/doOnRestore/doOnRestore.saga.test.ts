import { combineReducers } from 'redux';
import { expectSaga } from 'redux-saga-test-plan';
import { select } from 'redux-saga-test-plan/matchers';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { StoreKeys } from '../../store.keys';
import { initSelectors } from '../init.selectors';
import { initReducer, InitState } from '../init.slice';

import { doOnRestoreSaga } from './doOnRestore.saga';

describe('doOnRestoreSaga', () => {
  test('replace screen on restore', () => {
    expectSaga(doOnRestoreSaga)
      .withReducer(combineReducers({ [StoreKeys.Init]: initReducer }), {
        [StoreKeys.Init]: {
          ...new InitState(),
        },
      })
      .provide([[select(initSelectors.isRestored), true]])
      .call(replaceScreen, ScreenNames.MainScreen);
  });
});
