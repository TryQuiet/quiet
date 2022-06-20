import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { PublicChannel } from '../publicChannels.types'
import { sendInitialChannelMessageSaga } from './sendInitialChannelMessage.saga'
import { messagesActions } from '../../messages/messages.slice'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let channel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel
  })

  test('send initial channel message', async () => {
    await expectSaga(sendInitialChannelMessageSaga, publicChannelsActions.sendInitialChannelMessage({ channelName: channel.name, channelAddress: channel.address }))
      .put(messagesActions.sendMessage({
        type: 3,
        message: `Created #${channel.name}`,
        channelAddress: channel.address
      }))
      .run()
  })
})
