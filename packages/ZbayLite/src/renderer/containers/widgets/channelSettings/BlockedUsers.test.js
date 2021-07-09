/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './BlockedUsers'

import { ChannelState } from '../../../store/handlers/channel'
import { initialState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'
import { ChannelMessages } from '../../../store/handlers/messages'

import create from '../../../store/create'

const messages = [
  {
    createdAt: 1567683687,
    id: 'test-1',
    type: 6,
    message: 'test',
    publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
    sender: {
      replyTo: '',
      username: 'test123'
    }
  },
  {
    createdAt: 1567683647,
    id: 'test-1',
    type: 7,
    message: 'test',
    publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
    sender: {
      replyTo: '',
      username: 'test123'
    }
  }
]
const channelId = 'randomid'
const baseStore = {
  channel: {
    ...ChannelState,
    spentFilterValue: 38,
    id: channelId,
    shareableUri: 'testuri',
    members: new BigNumber(0),
    message: 'Message written in the input'
  },
  channels: {
    ...initialState,
    data: [createChannel(channelId)]
  },
  certificates: {
    usersCertificates: ['MIIBtjCCAVwCBgF6Urb0VDAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDYyODEzMDIzOVoXDTMwMTIzMTIzMDAwMFowgZcxgZQwFAYKKwYBBAGDjBsCARMGZGFtaWFuMD8GA1UEAxM4YXp2eTcybmV4NXZzeWd2NW1ma3M0c2YyN2pycWRoZXpueDIzYm1xeHE3YzdtajNibW5pc3hhaWQwOwYJKwYBAgEPAwEBEy5RbVpWZnhrNWpQb2tiVmlqODNhWVV4ZXRaeWF5bnZCVlRCaGZQUlBSM3hndVZLMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErEDIPiIQsZ020N34a+KtVLURm+68lyq0T7eklOlE6G3matt9vLKadwM4pNzJRhRigO1W0MNH3uOrwG1o2UOOX6MdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIgAocVe47k6ok0wA9vFaMRUxiD7syVPh+d3YIKLHanj5UCIQCNiXIh8DKsfkSICqzG3LxWl15W5Rq7wVij1fdM6AXo7Q=='],
    ownCertificate: {
      certificate: 'MIIBtjCCAVwCBgF6Urb0VDAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDYyODEzMDIzOVoXDTMwMTIzMTIzMDAwMFowgZcxgZQwFAYKKwYBBAGDjBsCARMGZGFtaWFuMD8GA1UEAxM4YXp2eTcybmV4NXZzeWd2NW1ma3M0c2YyN2pycWRoZXpueDIzYm1xeHE3YzdtajNibW5pc3hhaWQwOwYJKwYBAgEPAwEBEy5RbVpWZnhrNWpQb2tiVmlqODNhWVV4ZXRaeWF5bnZCVlRCaGZQUlBSM3hndVZLMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErEDIPiIQsZ020N34a+KtVLURm+68lyq0T7eklOlE6G3matt9vLKadwM4pNzJRhRigO1W0MNH3uOrwG1o2UOOX6MdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIgAocVe47k6ok0wA9vFaMRUxiD7syVPh+d3YIKLHanj5UCIQCNiXIh8DKsfkSICqzG3LxWl15W5Rq7wVij1fdM6AXo7Q==',
      privateKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgUMBHFeLut2Tyr5T5hkEtnbh4vx1XSEx2fBTwv29FytagCgYIKoZIzj0DAQehRANCAASsQMg+IhCxnTbQ3fhr4q1UtRGb7ryXKrRPt6SU6UTobeZq2328spp3Azik3MlGFGKA7VbQw0fe46vAbWjZQ45f'
    }
  }
}
describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      ...baseStore,
      messages: {
        [channelId]: {
          ...ChannelMessages,
          messages: [...messages]
        }
      }
    })
  })

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    expect(state).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
