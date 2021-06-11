import { TestApi, testSaga } from 'redux-saga-test-plan';
import { assetsActions } from '../../assets/assets.slice';
import { initActions } from '../../init/init.slice';
import { InitCheckKeys } from '../../init/initCheck.keys';
import { socketActions } from '../socket.slice';

import { connect, startConnectionSaga, useIO } from './startConnection.saga';

describe('startConnectionSaga', () => {
  const saga: TestApi = testSaga(startConnectionSaga);

  beforeEach(() => {
    saga.restart();
  });

  test('should connect with websocket', () => {
    const socket = jest.fn();
    saga
      .next()
      .call(connect)
      .next(socket)
      .put(socketActions.setConnected(true))
      .next()
      .put(
        assetsActions.setDownloadHint(
          'Replicating data from distributed database',
        ),
      )
      .next()
      .put(
        initActions.updateInitCheck({
          event: InitCheckKeys.Websocket,
          passed: true,
        }),
      )
      .next()
      .fork(useIO, socket)
      .next()
      .isDone();
  });
});
