import { Crypto } from '@peculiar/webcrypto'
import {
  assertReceivedCertificates,
  assertReceivedChannelsAndSubscribe,
  assertReceivedMessages,
  assertReceivedMessagesAreValid
} from '../integrationTests/assertions'
import {
  createCommunity,
  joinCommunity,
  getCommunityOwnerData,
  sendMessage,
  getInfoMessages
} from '../integrationTests/appActions'
import { createApp, sleep, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { ChannelMessage } from '@quiet/state-manager'

const crypto = new Crypto()

global.crypto = crypto

describe('send message - users go offline and online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>
  let userTwo: AsyncReturnType<typeof createApp>

  let userOneOldState: Partial<ReturnType<typeof owner.store.getState>>
  let userTwoOldState: Partial<ReturnType<typeof owner.store.getState>>

  let userOneDataPath: string
  let userTwoDataPath: string

  const timeout = 18_000_000 // 5 hours

  const expectedMessages: ChannelMessage[] = []

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

  it('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  it('Two users join community', async () => {
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

    const infoMessages = getInfoMessages(owner.store, 'general')
    expectedMessages.concat(infoMessages)
  })

  it('Owner and users received certificates', async () => {
    await assertReceivedCertificates('owner', 3, timeout, owner.store)
    await assertReceivedCertificates('userOne', 3, timeout, userOne.store)
    await assertReceivedCertificates('userTwo', 3, timeout, userTwo.store)
  })

  it('Users replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, timeout, userOne.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, timeout, userTwo.store)
  })

  it('Every user sends one message to general channel', async () => {
    expectedMessages.push(await sendMessage({ message: 'owner says hi', store: owner.store }))
    await sleep(40_000)
    expectedMessages.push(await sendMessage({ message: 'userOne says hi', store: userOne.store }))
    await sleep(40_000)
    expectedMessages.push(await sendMessage({ message: 'userTwo says hi', store: userTwo.store }))

    // Wait 10 seconds before closing the app, so writing to databases can be finished
    await sleep(10_000)
  })

  it('User one and two go offline', async () => {
    userOneOldState = storePersistor(userOne.store.getState())
    userTwoOldState = storePersistor(userTwo.store.getState())
    userOneDataPath = userOne.appPath
    userTwoDataPath = userTwo.appPath
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  it('Owner sends messages, while users are offline', async () => {
    expectedMessages.push(
      await sendMessage({
        message: 'Hi folks, how u doin? Does Wacek still has covid?',
        store: owner.store
      })
    )
  })

  it('users come back online', async () => {
    userOne = await createApp(userOneOldState, userOneDataPath)
    userTwo = await createApp(userTwoOldState, userTwoDataPath)
  })

  it('Owner replicated all messages', async () => {
    await assertReceivedMessages('owner', expectedMessages, timeout, owner.store)
  })

  it('userOne replicated all messages', async () => {
    await assertReceivedMessages('userOne', expectedMessages, timeout, userOne.store)
  })

  it('userTwo replicated all messages', async () => {
    await assertReceivedMessages('userTwo', expectedMessages, timeout, userTwo.store)
  })

  it('Replicated messages are valid', async () => {
    await assertReceivedMessagesAreValid('owner', expectedMessages, timeout, owner.store)
    await assertReceivedMessagesAreValid('userOne', expectedMessages, timeout, owner.store)
    await assertReceivedMessagesAreValid('userTwo', expectedMessages, timeout, owner.store)
  })
})

describe.only('send message - users are online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>
  // let userTwo: AsyncReturnType<typeof createApp>

  const timeout = 18_000_000 // 5 hours

  const expectedMessages: ChannelMessage[] = []

  beforeAll(async () => {
    owner = await createApp()
    userOne = await createApp()
    // userTwo = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await userOne.manager.closeAllServices()
    // await userTwo.manager.closeAllServices()
  })

  it('Owner creates community', async () => {
    console.log(1)
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  it('Two users join community', async () => {
    console.log(2)
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })

    // await joinCommunity({
    //   ...ownerData,
    //   store: userTwo.store,
    //   userName: 'username2',
    //   expectedPeersCount: 3
    // })

    const infoMessages = getInfoMessages(owner.store, 'general')
    expectedMessages.concat(infoMessages)
  })

  it('Owner and users received certificates', async () => {
    console.log(3)
    await assertReceivedCertificates('owner', 2, timeout, owner.store)
    await assertReceivedCertificates('userOne', 2, timeout, userOne.store)
    // await assertReceivedCertificates('userTwo', 3, timeout, userTwo.store)
  })

  it('Users replicated channel and subscribed to it', async () => {
    console.log(4)
    await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
    await assertReceivedChannelsAndSubscribe('userTwo', 1, timeout, userOne.store)
    // await assertReceivedChannelsAndSubscribe('userTwo', 1, timeout, userTwo.store)
  })

  it('each user sends one message to general channel', async () => {
    console.log(5)
    expectedMessages.push(await sendMessage({ message: 'owner says hi', store: owner.store }))
    expectedMessages.push(await sendMessage({ message: 'userOne says hi', store: userOne.store }))
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    // expectedMessages.push(await sendMessage({ message: 'userTwo says hi', store: userTwo.store }))
  })

  it('Owner replicated all messages', async () => {
    console.log(6)
    await assertReceivedMessages('owner', expectedMessages, timeout, owner.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('userOne replicated all messages', async () => {
    console.log(7)
    await assertReceivedMessages('userOne', expectedMessages, timeout, userOne.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  // it('userTwo replicated all messages', async () => {
  //   console.log(8)
  //   await assertReceivedMessages('userTwo', expectedMessages, timeout, userTwo.store)
  // })

  it('Replicated messages are valid', async () => {
    console.log(9)
    await assertReceivedMessagesAreValid('owner', expectedMessages, timeout, owner.store)
    await assertReceivedMessagesAreValid('userOne', expectedMessages, timeout, userOne.store)
    // await assertReceivedMessagesAreValid('userTwo', expectedMessages, timeout, userTwo.store)
  })
})
