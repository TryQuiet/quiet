import { put, select, call, delay } from 'typed-redux-saga';
import { initActions } from '../../init/init.slice';

import nodejs from 'zbayapp-nodejs-mobile-react-native';
import { initSelectors } from '../../init/init.selectors';

export function* startWaggleSaga(): Generator {
  while (true) {
    const dataDirectoryPath = yield* select(initSelectors.dataDirectoryPath);
    const torData = yield* select(initSelectors.torData);
    if (
      dataDirectoryPath !== '' &&
      torData.socksPort !== 0 &&
      torData.controlPort !== 0
    ) {
      yield* put(
        initActions.updateInitDescription(
          'Data is being retrieved from a distributed database',
        ),
      );
      yield* put(initActions.onWaggleStarted(true));
      yield* call(
        startNodeProcess,
        dataDirectoryPath,
        torData.socksPort,
        torData.controlPort,
        torData.authCookie,
      );
      break;
    }
    yield* delay(500);
  }
}

export const startNodeProcess = (
  dataDirectoryPath: string,
  socksPort: number,
  controlPort: number,
  authCookie: string,
) => {
  nodejs.start(
    `node_modules/waggle/lib/mobileWaggleManager.js -d ${dataDirectoryPath} -s ${socksPort} -c ${controlPort} -a ${authCookie}`,
  );
};
