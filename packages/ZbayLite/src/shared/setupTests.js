import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import registerRequireContextHook from 'babel-plugin-require-context-hook/register'
import mockStorage from 'redux-persist-memory-storage'

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
global.fetch = jest.fn(() => Promise.resolve())
registerRequireContextHook()
process.env.ZBAY_IS_TESTNET = 1
Enzyme.configure({ adapter: new Adapter() })

jest.resetAllMocks()
