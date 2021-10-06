import debug from 'debug'
import communityTestCases from './community'
import { prepareStore } from './utils'
const log = Object.assign(debug('tests'), {
  error: debug('tests:err')
})

const testCases = [
  ...communityTestCases
]

function testCaseReducer(
  state = {
    usersWithReplicatedCertificates: 0,
  }, action) {
  switch (action.type) {
    case 'userReplicatedCertificates':
      state.usersWithReplicatedCertificates++
      return state
    default:
      return state
  }
}

const run = async () => {
  for (const testCase of testCases) {
    const reducers = {'Test': testCaseReducer}
    const { store, runSaga } = prepareStore(reducers)
    await testCase({ store, runSaga })
  }
}

run().catch((e) => {
  log.error('Error occurred while running integration tests', e)
  process.exit(1)
})
