/* eslint import/first: 0 */
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './SendMessagePopover'
import { IdentityState, Identity } from '../../../store/handlers/identity'

import create from '../../../store/create'

describe('Send message popover', () => {
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

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    const props = {
      ...state,
      address: 'zbay://uri/'
    }
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x, {
      publicKey: '030d0e5278e297d5c4d2038dfd7fe434592e00c9039c3b2a3884fa1bc167798180',
      txid: '030d0e5278e297d5c4d2038dfd7fe434592e00c9039c3b2a3884fa1bc1677981'
    })
    expect(actions).toMatchSnapshot()
  })
})
