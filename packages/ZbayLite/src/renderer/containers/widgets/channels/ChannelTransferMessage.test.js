/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { mapDispatchToProps, mapStateToProps } from './ChannelTransferMessage'
import { IdentityState, Identity } from '../../../store/handlers/identity'
import create from '../../../store/create'

describe('ChannelMessage', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        rates: Immutable.Map({
          usd: new BigNumber(1),
          zec: new BigNumber(1)
        }),
        identity: IdentityState({
          data: Identity({
            address: '123445'
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
