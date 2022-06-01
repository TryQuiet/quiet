import { Crypto } from '@peculiar/webcrypto'
import {
  assertDownloadedImage,
  assertReceivedCertificates,
  assertReceivedChannelsAndSubscribe,
  assertReceivedImages,
  assertReceivedMessages,
  assertReceivedMessagesAreValid
} from './assertions'
import { createCommunity, joinCommunity, getCommunityOwnerData, sendMessage, sendImage, SendImage } from './appActions'
import { createApp, createAppWithoutTor, sleep, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { FileContent } from '@quiet/state-manager'
import logger from '../logger'

const log = logger('files')

const crypto = new Crypto()

global.crypto = crypto

xdescribe('send files - users go offline and online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>
  let userTwo: AsyncReturnType<typeof createApp>
  let userOneOldState: Partial<ReturnType<typeof owner.store.getState>>
  let userTwoOldState: Partial<ReturnType<typeof owner.store.getState>>
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
    const ownerMessage = await sendMessage({ message: 'owner says hi', store: owner.store })
    await sleep(40_000)
    const userOneMessage = await sendMessage({ message: 'userOne says hi', store: userOne.store })
    await sleep(40_000)
    const userTwoMessage = await sendMessage({ message: 'userTwo says hi', store: userTwo.store })

    ownerMessagesData.push(ownerMessage)
    userOneMessagesData.push(userOneMessage)
    userTwoMessagesData.push(userTwoMessage)

    // Wait 10 seconds before closing the app, so writing to databases can be finished
    await sleep(10_000)
  })

  test('User one and two go offline', async () => {
    userOneOldState = storePersistor(userOne.store.getState())
    userTwoOldState = storePersistor(userTwo.store.getState())
    userOneDataPath = userOne.appPath
    userTwoDataPath = userTwo.appPath
    await userOne.manager.closeAllServices()
    await userTwo.manager.closeAllServices()
  })

  test('Owner sends messages, while users are offline', async () => {
    const ownerMessage = await sendMessage({
      message: 'Hi folks, how u doin? Does Wacek still has covid?',
      store: owner.store
    }
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

  const timeout = 240_000

  const image: FileContent = {
    path: `${__dirname}/assets/test-image.jpeg`,
    name: 'test-image',
    ext: '.jpeg'
  }

  beforeAll(async () => {
    owner = await createApp()
    userOne = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await userOne.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  test('Users joins community', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })
  })

  test('Owner and user received certificates', async () => {
    await assertReceivedCertificates('owner', 2, timeout, owner.store)
    await assertReceivedCertificates('userOne', 2, timeout, userOne.store)
  })

  test('User replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
    await assertReceivedChannelsAndSubscribe('userOne', 1, timeout, userOne.store)
  })

  let ownerMessageData

  test('user sends image to general channel', async () => {
    log(`Image ${JSON.stringify(image)}`)
    const payload: SendImage = {
      file: image,
      store: owner.store
    }
    ownerMessageData = await sendImage(payload)
  })

  test('userOne replicated image', async () => {
    await assertReceivedImages('userOne', 1, timeout, userOne.store)
  })

  test('userOne downloaded image', async () => {
    await assertDownloadedImage('userOne', image.name, timeout, userOne.store)
  })
})
