import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import registerRequireContextHook from 'babel-plugin-require-context-hook/register'
jest.mock('electron-store-webpack-wrapper')
jest.mock('./electronStore', () => ({
  get: () => {},
  set: () => {}
}))
jest.mock('electron', () => {
  return { ipcRenderer: { on: () => {} } }
})

global.fetch = jest.fn(() => Promise.resolve())
registerRequireContextHook()
process.env.ZBAY_IS_TESTNET = 1
Enzyme.configure({ adapter: new Adapter() })

jest.resetAllMocks()
