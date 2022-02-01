import directMessageChannel from './directMessageChannel'
import create from '../create'

const storeState = {
  directMessageChannel: {
    targetRecipientAddress: 'test-address',
    targetRecipientUsername: 'test-username'
  }
}

describe('directMessageChannel selector', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      ...storeState
    })
  })

  it('channel data selector', async () => {
    expect(directMessageChannel.directMessageChannel(store.getState())).toMatchSnapshot()
  })
})
