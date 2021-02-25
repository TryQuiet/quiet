import { mapStateToProps } from './DirectMessagesHeader'

import create from '../../../store/create'

describe('ChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      contacts: {
        address123: {
          username: 'testusername'
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState(), { contactId: 'address123' })
    expect(props).toMatchSnapshot()
  })
})
