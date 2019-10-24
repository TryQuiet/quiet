import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import each from 'jest-each'
import registerRequireContextHook from 'babel-plugin-require-context-hook/register'

global.fetch = jest.fn(() => Promise.resolve())
global.each = each
registerRequireContextHook()
process.env.ZBAY_IS_TESTNET = 1
Enzyme.configure({ adapter: new Adapter() })

jest.resetAllMocks()
