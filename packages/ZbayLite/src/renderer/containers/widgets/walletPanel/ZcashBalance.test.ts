import BigNumber from 'bignumber.js'

import { mapStateToProps } from './ZcashBalance'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/identity'

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
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
