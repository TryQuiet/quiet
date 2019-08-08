/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'
import Bignumber from 'bignumber.js'
import { mapDispatchToProps, mapStateToProps } from './ChannelTransferMessage'

import create from '../../../store/create'

describe('ChannelMessage', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        rates: Immutable.Map({
          usd: new Bignumber(1),
          zec: new Bignumber(1)
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
