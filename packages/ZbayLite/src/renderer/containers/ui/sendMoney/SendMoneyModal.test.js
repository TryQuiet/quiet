/* eslint import/first: 0 */
import { mapStateToProps } from './SendMoneyModal'
import create from '../../../store/create'

describe('SendMoneyModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        rates: {
          usd: '10',
          zec: '1'
        },
        identity: {
          data: {
            id: '1',
            address: 'test',
            name: 'Mars',
            balance: '2',
            shippingData: { firstName: 'testName', lastName: 'testLastName' }
          }
        }
      }
    })
  })
  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
