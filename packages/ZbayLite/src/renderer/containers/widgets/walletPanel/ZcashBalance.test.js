/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapStateToProps } from './ZcashBalance'

import create from '../../../store/create'
import { IdentityState, Identity } from '../../../store/handlers/identity'
import { RatesState } from '../../../store/handlers/rates'

describe('ZcashBalance', () => {
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
        }),
        rates: RatesState({
          zec: '1',
          usd: '2'
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
