import { mapStateToProps } from './IdentityPanel'

import create from '../../store/create'
import { initialState } from '../../store/handlers/identity'

describe('IdentityPanel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        identity: {
          ...initialState,
          data: {
            ...initialState.data,
            address: 'zctestaddress',
            balance: '23.435432',
            lockedBalance: '13.123432',
            name: 'saturn'
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
