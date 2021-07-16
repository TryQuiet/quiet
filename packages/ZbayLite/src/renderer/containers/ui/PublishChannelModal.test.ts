import { mapStateToProps, mapDispatchToProps } from './PublishChannelModal'

import create from '../../store/create'

describe('PublishChannelModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
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
      publicChannels: {}
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
