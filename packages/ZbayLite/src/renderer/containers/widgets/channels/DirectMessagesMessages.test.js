import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import { mapStateToProps } from './DirectMessagesMessages'

import { createReceivedMessage, now } from '../../../testUtils'
import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { ReceivedMessage } from '../../../store/handlers/messages'

describe('ChannelInput', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    const channelId = 'this-is-test-channel-id'
    store = create({
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        id: channelId,
        members: new BigNumber(0),
        message: 'This is a test message'
      },
      contacts: {
        address123: {
          messages: R.range(0, 4).map(id => {
            return {
              ...ReceivedMessage(
                createReceivedMessage({
                  id,
                  createdAt: now.minus({ hours: 2 * id }).toSeconds()
                })
              )
            }
          }
          ),
          vaultMessages: R.range(5, 8).map(id => {
            return {
              ...ReceivedMessage(
                createReceivedMessage({
                  id,
                  createdAt: now.minus({ hours: 2 * id }).toSeconds()
                })
              )
            }
          })
        }
      },
      certificates: {
        usersCertificates: ['MIIBtjCCAVwCBgF6Urb0VDAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDYyODEzMDIzOVoXDTMwMTIzMTIzMDAwMFowgZcxgZQwFAYKKwYBBAGDjBsCARMGZGFtaWFuMD8GA1UEAxM4YXp2eTcybmV4NXZzeWd2NW1ma3M0c2YyN2pycWRoZXpueDIzYm1xeHE3YzdtajNibW5pc3hhaWQwOwYJKwYBAgEPAwEBEy5RbVpWZnhrNWpQb2tiVmlqODNhWVV4ZXRaeWF5bnZCVlRCaGZQUlBSM3hndVZLMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErEDIPiIQsZ020N34a+KtVLURm+68lyq0T7eklOlE6G3matt9vLKadwM4pNzJRhRigO1W0MNH3uOrwG1o2UOOX6MdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIgAocVe47k6ok0wA9vFaMRUxiD7syVPh+d3YIKLHanj5UCIQCNiXIh8DKsfkSICqzG3LxWl15W5Rq7wVij1fdM6AXo7Q=='],
        ownCertificate: {
          certificate: 'MIIBtjCCAVwCBgF6Urb0VDAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMDYyODEzMDIzOVoXDTMwMTIzMTIzMDAwMFowgZcxgZQwFAYKKwYBBAGDjBsCARMGZGFtaWFuMD8GA1UEAxM4YXp2eTcybmV4NXZzeWd2NW1ma3M0c2YyN2pycWRoZXpueDIzYm1xeHE3YzdtajNibW5pc3hhaWQwOwYJKwYBAgEPAwEBEy5RbVpWZnhrNWpQb2tiVmlqODNhWVV4ZXRaeWF5bnZCVlRCaGZQUlBSM3hndVZLMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErEDIPiIQsZ020N34a+KtVLURm+68lyq0T7eklOlE6G3matt9vLKadwM4pNzJRhRigO1W0MNH3uOrwG1o2UOOX6MdMBswDAYDVR0TBAUwAwIBAzALBgNVHQ8EBAMCAAYwCgYIKoZIzj0EAwIDSAAwRQIgAocVe47k6ok0wA9vFaMRUxiD7syVPh+d3YIKLHanj5UCIQCNiXIh8DKsfkSICqzG3LxWl15W5Rq7wVij1fdM6AXo7Q==',
          privateKey: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgUMBHFeLut2Tyr5T5hkEtnbh4vx1XSEx2fBTwv29FytagCgYIKoZIzj0DAQehRANCAASsQMg+IhCxnTbQ3fhr4q1UtRGb7ryXKrRPt6SU6UTobeZq2328spp3Azik3MlGFGKA7VbQw0fe46vAbWjZQ45f'
        }
      }
    })
  })

  it('will receive right props for direct message', async () => {
    const props = mapStateToProps(store.getState(), { contactId: 'address123' })
    expect(props).toMatchSnapshot()
  })
})
