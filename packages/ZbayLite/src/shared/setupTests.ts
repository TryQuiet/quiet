import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import registerRequireContextHook from 'babel-plugin-require-context-hook/register'
import mockStorage from 'redux-persist-memory-storage'

import { setEngine, CryptoEngine } from 'pkijs'

import { Crypto } from '@peculiar/webcrypto'

const webcrypto = new Crypto()
setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle
  })
)

jest.mock('electron-store-webpack-wrapper')

jest.mock('./electronStore', () => ({
  get: () => {},
  set: () => {}
}))

jest.mock('electron', () => {
  return { ipcRenderer: { on: () => {}, send: jest.fn() } }
})

// eslint-disable-next-line new-cap
jest.mock('redux-persist-electron-storage', () => () => new mockStorage())

jest.mock('react-jdenticon', () => () => 'Jdenticon')

// eslint-disable-next-line
const mockFetch: typeof fetch = async () => await Promise.resolve({} as Response)
global.fetch = mockFetch

registerRequireContextHook()
process.env.ZBAY_IS_TESTNET = '1'
Enzyme.configure({ adapter: new Adapter() })

jest.resetAllMocks()
