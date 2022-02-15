import { put, select, call, delay } from 'typed-redux-saga'
import { initActions } from '../../init/init.slice'
import { initSelectors } from '../../init/init.selectors'
import FindFreePort from 'react-native-find-free-port'
import nodejs from 'zbayapp-nodejs-mobile-react-native'

export function* startWaggleSaga(): Generator {
  while (true) {
    const dataDirectoryPath = yield* select(initSelectors.dataDirectoryPath)
    const dataPort = yield* call(FindFreePort.getFirstStartingFrom, 4677)
    const torData = yield* select(initSelectors.torData)
    if (
      dataDirectoryPath !== '' &&
      dataPort !== 0 &&
      torData.socksPort !== 0 &&
      torData.controlPort !== 0
    ) {
      yield* put(
        initActions.updateInitDescription(
          'Data is being retrieved from a distributed database'
        )
      )
      yield* call(
        startNodeProcess,
        dataDirectoryPath,
        dataPort,
        torData.socksPort,
        torData.controlPort,
        torData.authCookie
      )
      yield* put(initActions.onWaggleStarted(dataPort))
      break
    }
    yield* delay(500)
  }
}

export const startNodeProcess = (
  dataDirectoryPath: string,
  dataPort: number,
  socksPort: number,
  controlPort: number,
  authCookie: string
) => {
  nodejs.start(
    `lib/mobileWaggleManager.js -d ${dataDirectoryPath} -p ${dataPort} -s ${socksPort} -c ${controlPort} -a ${authCookie}`
  )
}
