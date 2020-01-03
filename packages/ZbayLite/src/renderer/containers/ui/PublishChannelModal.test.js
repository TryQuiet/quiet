/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './PublishChannelModal'

import create from '../../store/create'
import { RatesState } from '../../store/handlers/rates'
import { ChannelsState } from '../../store/handlers/channels'

describe('PublishChannelModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        fees: {
          publicChannel: 0.1
        },
        identity: {
          data: {
            balance: '23.435432'
          }
        },
        channel: {
          id: 1
        },
        publicChannels: {},
        rates: RatesState({
          usd: '232.11'
        }),
        channels: ChannelsState({
          data: [Immutable.Map({ id: 1, address: 'testAddress' })]
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
