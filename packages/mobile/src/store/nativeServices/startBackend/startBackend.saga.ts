import { put, select, call, delay } from 'typed-redux-saga'
import { initActions } from '../../init/init.slice'
import { initSelectors } from '../../init/init.selectors'
import FindFreePort from 'react-native-find-free-port'
import nodejs from 'nodejs-mobile-react-native'

export function* startBackendSaga(): Generator {
  // while (true) {
    // const dataDirectoryPath = yield* select(initSelectors.dataDirectoryPath)
    const dataPort = yield* call(FindFreePort.getFirstStartingFrom, 4677)
    // const torData = yield* select(initSelectors.torData)
    // if (
    //   dataDirectoryPath !== '' &&
    //   dataPort !== 0 &&
    //   torData.httpTunnelPort !== 0 &&
    //   torData.socksPort !== 0 &&
    //   torData.controlPort !== 0
    // ) {
    //   yield* put(
    //     initActions.updateInitDescription(
    //       'Starting backend'
    //     )
    //   )
    //   yield* call(
    //     startNodeProcess,
    //     dataDirectoryPath,
    //     dataPort,
    //     torData.httpTunnelPort,
    //     torData.socksPort,
    //     torData.controlPort,
    //     torData.authCookie
    //   )
      yield* put(initActions.onBackendStarted({ dataPort: dataPort }))
    //   break
    // }
    // yield* delay(500)
  // }
}

export const startNodeProcess = (
  dataDirectoryPath: string,
  dataPort: number,
  httpTunnelPort: number,
  socksPort: number,
  controlPort: number,
  authCookie: string
) => {
  nodejs.startWithArgs(
    `lib/mobileBackendManager.js -d ${dataDirectoryPath} -p ${dataPort} -t ${httpTunnelPort} -s ${socksPort} -c ${controlPort} -a ${authCookie}`
  )
}
