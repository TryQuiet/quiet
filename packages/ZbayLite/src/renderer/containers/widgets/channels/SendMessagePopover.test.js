/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './SendMessagePopover'
import { initialState } from '../../../store/handlers/identity'

import create from '../../../store/create'

describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        rates: {
          usd: new BigNumber(1),
          zec: new BigNumber(1)
        },
        identity: {
          ...initialState,
          data: {
            address: '123445'
          }
        }
      }
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
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
