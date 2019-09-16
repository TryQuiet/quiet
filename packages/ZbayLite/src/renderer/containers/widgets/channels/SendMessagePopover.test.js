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
      address: 'zbay.io/uri/'
    }
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
