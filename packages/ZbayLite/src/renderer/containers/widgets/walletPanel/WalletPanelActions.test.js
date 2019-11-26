import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './WalletPanelActions'
import { IdentityState, Identity } from '../../../store/handlers/identity'
import create from '../../../store/create'

describe('WalletPanelActions', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity({
            balance: new BigNumber('33.583004'),
            lockedBalance: new BigNumber('12.583004')
          })
        })
      })
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
