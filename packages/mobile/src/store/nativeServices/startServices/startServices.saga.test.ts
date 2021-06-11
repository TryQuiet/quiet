import { TestApi, testSaga } from 'redux-saga-test-plan';
import { assetsActions } from '../../assets/assets.slice';
import { initActions } from '../../init/init.slice';
import { InitCheckKeys } from '../../init/initCheck.keys';

import { initAndroidServices, startServicesSaga } from './startServices.saga';

describe('startServicesSaga', () => {
  const saga: TestApi = testSaga(startServicesSaga);

  beforeEach(() => {
    saga.restart();
  });

  test('should init android services', () => {
    saga
      .next()
      .put(
        assetsActions.setDownloadHint(
          'Setting up software that will take care of your chats',
        ),
      )
      .next()
      .put(
        initActions.updateInitCheck({
          event: InitCheckKeys.NativeServices,
          passed: true,
        }),
      )
      .next()
      .call(initAndroidServices)
      .next()
      .isDone();
  });
});
