import { Crypto } from '@peculiar/webcrypto'
import {
  assertReceivedCertificates,
  assertReceivedChannelsAndSubscribe,
  assertReceivedMessages,
  assertReceivedMessagesAreValid
} from './assertions'
import { createCommunity, joinCommunity, getCommunityOwnerData, sendMessage } from './appActions'
import { createApp, createAppWithoutTor, sleep } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'

jest.setTimeout(600_000)
const crypto = new Crypto()

global.crypto = crypto

describe('send message - users go offline and online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>
  let userTwo: AsyncReturnType<typeof createApp>
  let userOneOldState: ReturnType<typeof owner.store.getState>
  let userTwoOldState: ReturnType<typeof owner.store.getState>
  let userOneDataPath: string
  let userTwoDataPath: string
  let allMessages = []
  const ownerMessagesData = []
  const userOneMessagesData = []
  const userTwoMessagesData = []

  beforeAll(async () => {
    owner = await createApp()
    userOne = await createApp()
    userTwo = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  test('Two users join community', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })

    await joinCommunity({
      ...ownerData,
      store: userTwo.store,
      userName: 'username2',
      expectedPeersCount: 3
    })
  })

  test('Owner and users received certificates', async () => {
    await assertReceivedCertificates('owner', 3, 120_000, owner.store)
    await assertReceivedCertificates('userOne', 3, 120_000, userOne.store)
    await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store)
  })

  test('Users replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, 120_000, owner.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userOne.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userTwo.store)
  })

  test('Every user sends one message to general channel', async () => {
    const ownerMessage = await sendMessage('owner says hi', owner.store)
    await sleep(40_000)
    const userOneMessage = await sendMessage('userOne says hi', userOne.store)
    await sleep(40_000)
    const userTwoMessage = await sendMessage('userTwo says hi', userTwo.store)

    ownerMessagesData.push(ownerMessage)
    userOneMessagesData.push(userOneMessage)
    userTwoMessagesData.push(userTwoMessage)

    // Wait 10 seconds before closing the app, so writing to databases can be finished
    await sleep(10_000)
  })

  test('User one and two go offline', async () => {
    userOneOldState = userOne.store.getState()
    userTwoOldState = userTwo.store.getState()
    userOneDataPath = userOne.appPath
    userTwoDataPath = userTwo.appPath
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  test('Owner sends messages, while users are offline', async () => {
    const ownerMessage = await sendMessage(
      'Hi folks, how u doin? Does Wacek still has covid?',
      owner.store
    )
    ownerMessagesData.push(ownerMessage)
  })

  test('users come back online', async () => {
    userOne = await createApp(userOneOldState, userOneDataPath)
    userTwo = await createApp(userTwoOldState, userTwoDataPath)
  })

  test('Owner replicated all messages', async () => {
    allMessages = [...ownerMessagesData, ...userOneMessagesData, ...userTwoMessagesData]

    await assertReceivedMessages('owner', allMessages.length, 360_000, owner.store)
  })

  test('userOne replicated all messages', async () => {
    await assertReceivedMessages('userOne', allMessages.length, 360_000, userOne.store)
  })

  test('userTwo replicated all messages', async () => {
    await assertReceivedMessages('userTwo', allMessages.length, 360_000, userTwo.store)
  })

  test('Replicated messages are valid', async () => {
    await assertReceivedMessagesAreValid('owner', allMessages, 20000, owner.store)
    await assertReceivedMessagesAreValid('userOne', allMessages, 20000, owner.store)
    await assertReceivedMessagesAreValid('userTwo', allMessages, 20000, owner.store)
  })
})

describe.only('send message - users are online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>
  let userTwo: AsyncReturnType<typeof createApp>

  beforeAll(async () => {
    owner = await createApp()
    userOne = await createApp()
    userTwo = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  test('Two users join community', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })

    await joinCommunity({
      ...ownerData,
      store: userTwo.store,
      userName: 'username2',
      expectedPeersCount: 3
    })
  })

  test('Owner and users received certificates', async () => {
    await assertReceivedCertificates('owner', 3, 120_000, owner.store)
    await assertReceivedCertificates('userOne', 3, 120_000, userOne.store)
    await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store)
  })

  test('Users replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, 120_000, owner.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userOne.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userTwo.store)
  })

  let ownerMessageData
  let userOneMessageData
  let userTwoMessageData

  test('owner user sends one message to general channel', async () => {
    ownerMessageData = await sendMessage('owner says hi', owner.store)
  })

  test('Owner replicated all messages 1/3', async () => {
    await assertReceivedMessages('owner', 1, 120_000, owner.store)
  })

  test('userOne replicated all messages 1/3', async () => {
    await assertReceivedMessages('userOne', 1, 120_000, userOne.store)
  })

  test('userTwo replicated all messages 1/3', async () => {
    await assertReceivedMessages('userTwo', 1, 120_000, userTwo.store)
  })
  test('user One sends one message to general channel', async () => {
    userOneMessageData = await sendMessage('userOne says hi', userOne.store)
  })

  test('Owner replicated all messages 2/3', async () => {
    await assertReceivedMessages('owner', 2, 120_000, owner.store)
  })

  test('userOne replicated all messages 2/3', async () => {
    await assertReceivedMessages('userOne', 2, 120_000, userOne.store)
  })

  test('userTwo replicated all messages 2/3', async () => {
    await assertReceivedMessages('userTwo', 2, 120_000, userTwo.store)
  })
  test('user Two sends one message to general channel', async () => {
    userTwoMessageData = await sendMessage('userTwo says hi', userTwo.store)
  })

  test('Owner replicated all messages 3/3', async () => {
    await assertReceivedMessages('owner', 3, 120_000, owner.store)
  })

  test('userOne replicated all messages 3/3', async () => {
    await assertReceivedMessages('userOne', 3, 120_000, userOne.store)
  })

  test('userTwo replicated all messages 3/3', async () => {
    await assertReceivedMessages('userTwo', 3, 120_000, userTwo.store)
  })

  test('Replicated messages are valid', async () => {
    await assertReceivedMessagesAreValid(
      'owner',
      [ownerMessageData, userOneMessageData, userTwoMessageData],
      20000,
      owner.store
    )
    await assertReceivedMessagesAreValid(
      'userOne',
      [ownerMessageData, userOneMessageData, userTwoMessageData],
      20000,
      userOne.store
    )
    await assertReceivedMessagesAreValid(
      'userTwo',
      [userTwoMessageData, ownerMessageData, userOneMessageData],
      20000,
      userTwo.store
    )
  })
})

describe.skip('send message - without tor', () => {
  let owner: AsyncReturnType<typeof createAppWithoutTor>
  let userOne: AsyncReturnType<typeof createAppWithoutTor>
  let userTwo: AsyncReturnType<typeof createAppWithoutTor>

  beforeAll(async () => {
    owner = await createAppWithoutTor()
    userOne = await createAppWithoutTor()
    userTwo = await createAppWithoutTor()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  test('Two users join community', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })

    await joinCommunity({
      ...ownerData,
      store: userTwo.store,
      userName: 'username2',
      expectedPeersCount: 3
    })
  })

  test('Owner and users received certificates', async () => {
    await assertReceivedCertificates('owner', 3, 120_000, owner.store)
    await assertReceivedCertificates('userOne', 3, 120_000, userOne.store)
    await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store)
  })

  test('Users replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, 120_000, owner.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userOne.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, 120_000, userTwo.store)
  })

  let ownerMessageData
  let userOneMessageData
  let userTwoMessageData

  test('Every user sends one message to general channel', async () => {
    ownerMessageData = await sendMessage('owner says hi', owner.store)
    userOneMessageData = await sendMessage('userOne says hi', userOne.store)
    userTwoMessageData = await sendMessage('userTwo says hi', userTwo.store)
  })

  test('Every user replicated all messages', async () => {
    await assertReceivedMessages('owner', 3, 120_000, owner.store)
    await assertReceivedMessages('userOne', 3, 120_000, userOne.store)
    await assertReceivedMessages('userTwo', 3, 120_000, userTwo.store)
  })

  test('Replicated messages are valid', async () => {
    await assertReceivedMessagesAreValid(
      'owner',
      [ownerMessageData, userOneMessageData, userTwoMessageData],
      20000,
      owner.store
    )
    await assertReceivedMessagesAreValid(
      'userOne',
      [ownerMessageData, userOneMessageData, userTwoMessageData],
      20000,
      owner.store
    )
    await assertReceivedMessagesAreValid(
      'userTwo',
      [ownerMessageData, userOneMessageData, userTwoMessageData],
      20000,
      owner.store
    )
  })
})
