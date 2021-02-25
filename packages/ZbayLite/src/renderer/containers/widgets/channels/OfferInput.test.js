import * as R from 'ramda'

import BigNumber from 'bignumber.js'

import { mapStateToProps, mapDispatchToProps } from './OfferInput'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { Offer } from '../../../store/handlers/offers'
import testUtils from '../../../testUtils'
import { ReceivedMessage } from '../../../store/handlers/messages'

const [identity1] = testUtils.identities
const recipientUsername = 'test-recipient-username'
const adId = '019a591525c10eb53017e07e91c27f60c0c41bd1059ee3e0762453f7625a82db'
describe('ChannelInput', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        name: 'Politics',
        members: new BigNumber(0),
        message: 'This is a test message',
        messages: []
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
                testUtils.messages.createReceivedMessage({
                  id,
                  createdAt: testUtils.now
                    .minus({ hours: 2 * id })
                    .toSeconds(),
                  sender: identity1
                })
              )
            }
          }
          ),
          newMessages: ['123', '1234']
        }
      }

    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState(), {
      offer: `${adId}${recipientUsername}`
    })
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x, {
      offer: `${adId}${recipientUsername}`
    })
    expect(actions).toMatchSnapshot()
  })
})
