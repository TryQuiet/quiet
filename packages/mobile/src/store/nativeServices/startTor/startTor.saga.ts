import { NativeModules } from 'react-native';
import { put, call } from 'typed-redux-saga';
import { initActions } from '../../init/init.slice';

import FindFreePort from 'react-native-find-free-port';

export function* startTorSaga(): Generator {
  yield* put(
    initActions.updateInitDescription('Tor initialization in progress'),
  );
  const socksPort = yield* call(FindFreePort.getFirstStartingFrom, 9050);
  const controlPort = yield* call(FindFreePort.getFirstStartingFrom, 9151);
  yield* call(NativeModules.TorModule.startTor, socksPort, controlPort);
}
