import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import { mapStateToProps } from './OfferMessages'

import { Offer } from '../../../store/handlers/offers'
import { now, messages, identities } from '../../../testUtils'
import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { ReceivedMessage } from '../../../store/handlers/messages'

const recipientUsername = 'test-recipient-username'
const adId = '019a591525c10eb53017e07e91c27f60c0c41bd1059ee3e0762453f7625a82db'
const [identity1] = identities

describe('ChannelInput', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    const channelId = 'this-is-test-channel-id'
    store = create({
      initialState: {
        channel: {
          ...ChannelState,
          spentFilterValue: 38,
          id: channelId,
          members: new BigNumber(0),
          message: 'This is a test message'
        },
        offers: {
          [`${adId}${recipientUsername}`]: {
            ...Offer,
            address: 'testAddress',
            itemId: 'testID',
            name: 'testname',
            lastSeen: '123',
            messages: R.range(0, 2).map(id => {
              return {
                ...ReceivedMessage(
                  messages.createReceivedMessage({
                    id,
                    createdAt: now.minus({ hours: 2 * id }).toSeconds(),
                    sender: identity1
                  })
                )
              }
            }
            ),
            newMessages: ['123', '1234']
          }
        },
        users: {}
      }
    })
  })

  it('will receive right props for offers', async () => {
    const props = mapStateToProps(store.getState(), {
      offer: `${adId}${recipientUsername}`
    })
    expect(props).toMatchSnapshot()
  })
})
