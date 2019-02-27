import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import each from 'jest-each'

global.fetch = jest.fn(() => Promise.resolve())
global.each = each

Enzyme.configure({ adapter: new Adapter() })
