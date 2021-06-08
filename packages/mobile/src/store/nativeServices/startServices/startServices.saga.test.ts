import { TestApi, testSaga } from 'redux-saga-test-plan';

import { initAndroidServices, startServicesSaga } from './startServices.saga';

describe('startServicesSaga', () => {
  const saga: TestApi = testSaga(startServicesSaga);

  beforeEach(() => {
    saga.restart();
  });

  test('should init android services', () => {
    saga.next().call(initAndroidServices).next().isDone();
  });
});
