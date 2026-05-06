import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { messagesActions } from '../messages.slice'
import { retryVerificationSaga } from './retryVerification.saga'
import { createLogger } from '../../../utils/logger'
import { type FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, getBaseTypesFactory } from '../../../utils/tests/factories'
import { messagesSelectors } from '../messages.selectors'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

const logger = createLogger('retryVerificationSaga-test')

describe('retryVerification saga (store-backed)', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypes: FactoryGirl

  beforeAll(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    baseTypes = await getBaseTypesFactory()
    await factory.create('Community')
  })

  it('empty inputs -> dispatches verifyMessages([])', async () => {
    const action = messagesActions.retryVerification({
      messages: [], // pass a fresh array literal; saga mutates it
      // channelId: undefined
      // messageIds: undefined
    })

    await expectSaga(retryVerificationSaga, action)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(
        messagesActions.verifyMessages({
          messages: [],
          isVerified: false,
        })
      )
      .run()
  })

  it('currentChannel=true picks invalid messages from the current channel', async () => {
    // Get the current channel id (default should be #general from Community factory)
    const currentChannelId = publicChannelsSelectors.currentChannelId(store.getState())
    expect(currentChannelId).toBeTruthy()

    // Build two messages targeting the current channel and add them to the store
    const msg1 = await baseTypes.build('ChannelMessage', { channelId: currentChannelId })
    const msg2 = await baseTypes.build('ChannelMessage', { channelId: currentChannelId })
    store.dispatch(
      messagesActions.addMessages({
        messages: [msg1, msg2],
      })
    )

    // Mark them invalid in the verification map
    store.dispatch(messagesActions.test_message_verification_status({ message: msg1, isVerified: false }))
    store.dispatch(messagesActions.test_message_verification_status({ message: msg2, isVerified: false }))

    const expectedInvalidForCurrent =
      (messagesSelectors as any).invalidChannelMessagesEntries(currentChannelId)(store.getState()) || []

    const action = messagesActions.retryVerification({
      messages: [],
      currentChannel: true,
    })

    await expectSaga(retryVerificationSaga, action)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(
        messagesActions.verifyMessages({
          isVerified: false,
          messages: expectedInvalidForCurrent,
        })
      )
      .run()
  })

  it('channelId selects invalid messages only from that channel', async () => {
    // Create two channels
    const chA = await factory.create('PublicChannel')
    const chB = await factory.create('PublicChannel')

    const channelIdA = chA.channel.id
    const channelIdB = chB.channel.id

    // Add messages to both channels
    const a1 = await baseTypes.build('ChannelMessage', { channelId: channelIdA })
    const a2 = await baseTypes.build('ChannelMessage', { channelId: channelIdA })
    const b1 = await baseTypes.build('ChannelMessage', { channelId: channelIdB })

    store.dispatch(
      messagesActions.addMessages({
        messages: [a1, a2, b1],
      })
    )

    // Mark all as invalid; selector should filter by channel
    store.dispatch(messagesActions.test_message_verification_status({ message: a1, isVerified: false }))
    store.dispatch(messagesActions.test_message_verification_status({ message: a2, isVerified: false }))
    store.dispatch(messagesActions.test_message_verification_status({ message: b1, isVerified: false }))

    const expectedForA =
      (typeof messagesSelectors.invalidChannelMessagesEntries === 'function'
        ? // selector factory -> call with channelId, then state
          (messagesSelectors as any).invalidChannelMessagesEntries(channelIdA)(store.getState())
        : []) || []

    const action = messagesActions.retryVerification({
      messages: [],
      channelId: channelIdA,
    })

    await expectSaga(retryVerificationSaga, action)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(
        messagesActions.verifyMessages({
          isVerified: false,
          messages: expectedForA,
        })
      )
      .run()
  })

  it('messageIds selects those messages regardless of current verification status', async () => {
    const ch = await factory.create('PublicChannel')
    const channelId = ch.channel.id

    const m1 = await baseTypes.build('ChannelMessage', { channelId })
    const m2 = await baseTypes.build('ChannelMessage', { channelId })
    const m3 = await baseTypes.build('ChannelMessage', { channelId })

    // Add all to store
    store.dispatch(
      messagesActions.addMessages({
        messages: [m1, m2, m3],
      })
    )

    // Mark mixed verification states to ensure selector ignores status
    store.dispatch(messagesActions.test_message_verification_status({ message: m1, isVerified: true }))
    store.dispatch(messagesActions.test_message_verification_status({ message: m2, isVerified: false }))
    store.dispatch(messagesActions.test_message_verification_status({ message: m3, isVerified: true }))

    const ids = [m1.id, m2.id]

    const expectedSelected =
      (typeof messagesSelectors.messagesByIds === 'function'
        ? // selector factory -> call with ids, then state
          (messagesSelectors as any).messagesByIds(ids)(store.getState())
        : []) || []

    const action = messagesActions.retryVerification({
      messages: [],
      messageIds: ids,
    })

    await expectSaga(retryVerificationSaga, action)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(
        messagesActions.verifyMessages({
          isVerified: false,
          messages: expectedSelected,
        })
      )
      .run()
  })

  it('merges payload.messages + channelId invalids + messageIds (order preserved, deduped)', async () => {
    // Create two fresh channels
    const chA = await factory.create('PublicChannel')
    const chB = await factory.create('PublicChannel')
    const channelIdA = chA.channel.id
    const channelIdB = chB.channel.id

    // Payload messages (will be included first)
    const p1 = await baseTypes.build('ChannelMessage', { channelId: channelIdB })
    const p2 = await baseTypes.build('ChannelMessage', { channelId: channelIdA })
    store.dispatch(
      messagesActions.addMessages({
        messages: [p1, p2],
      })
    )

    // Invalid messages in channel A (should be appended after payload)
    const a1 = await baseTypes.build('ChannelMessage', { channelId: channelIdA })
    const a2 = await baseTypes.build('ChannelMessage', { channelId: channelIdA })
    store.dispatch(messagesActions.addMessages({ messages: [a1, a2] }))
    store.dispatch(messagesActions.test_message_verification_status({ message: a1, isVerified: false }))
    store.dispatch(messagesActions.test_message_verification_status({ message: a2, isVerified: false }))

    // Additional message to be pulled via messageIds
    const extra = await baseTypes.build('ChannelMessage', { channelId: channelIdB })
    store.dispatch(messagesActions.addMessages({ messages: [extra] }))

    // messageIds includes p2 (to assert duplicate is preserved) and extra
    const ids = [p2.id, extra.id]

    // Derive expected segments via selectors
    const expectedChannelPart =
      (messagesSelectors as any).invalidChannelMessagesEntries(channelIdA)(store.getState()) || []
    const expectedIdsPart = (messagesSelectors as any).messagesByIds(ids)(store.getState()) || []

    // Build expected merged list and apply de-duplication (first occurrence wins)
    const concatenated = [p1, p2, ...expectedChannelPart, ...expectedIdsPart]
    const seen = new Set<string>()
    const expectedMerged = concatenated.filter(m => {
      if (!m) return false
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })

    const action = messagesActions.retryVerification({
      messages: [p1, p2],
      channelId: channelIdA,
      messageIds: ids,
    })

    await expectSaga(retryVerificationSaga, action)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(
        messagesActions.verifyMessages({
          isVerified: false,
          messages: expectedMerged,
        })
      )
      .run()
  })
})
