import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import each from 'jest-each'

global.fetch = jest.fn(() => Promise.resolve())
global.each = each
process.env.ZBAY_IS_TESTNET = 1
Enzyme.configure({ adapter: new Adapter() })

jest.resetAllMocks()
