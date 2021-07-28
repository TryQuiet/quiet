import { TestApi, testSaga } from 'redux-saga-test-plan';
import { initActions } from '../../init/init.slice';

import { startTorSaga } from './startTor.saga';

describe('startTorSaga', () => {
  const saga: TestApi = testSaga(startTorSaga);

  beforeEach(() => {
    saga.restart();
  });

  test('should be defined', () => {
    saga
      .next()
      .put(initActions.updateInitDescription('Tor initialization in progress'))
      .next()
      .isDone();
  });
});
