import BigNumber from 'bignumber.js'

import { mapStateToProps } from './ZcashBalance'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/identity'
import { RatesState } from '../../../store/handlers/rates'

describe('ZcashBalance', () => {
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
      },
      rates: {
        ...RatesState,
        zec: '1',
        usd: '2'
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
