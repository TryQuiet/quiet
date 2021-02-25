import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './WalletPanelActions'
import { initialState } from '../../../store/handlers/identity'
import create from '../../../store/create'

describe('WalletPanelActions', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      identity: {
        ...initialState,
        data: {
          ...initialState.data,
          balance: new BigNumber('33.583004'),
          lockedBalance: new BigNumber('12.583004')
        }
      }
    })
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
