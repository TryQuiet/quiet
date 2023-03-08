import { Crypto } from '@peculiar/webcrypto'
import { createApp, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { FileContent } from '@quiet/state-manager'
import logger from '../logger'
import {
  createCommunity,
  getCommunityOwnerData,
  joinCommunity,
  SendImage,
  sendImage
} from '../integrationTests/appActions'
import { assertReceivedCertificates } from '../testUtils/assertions'
import {
  assertDownloadedImage,
  assertReceivedChannelsAndSubscribe,
  assertReceivedImages
} from '../integrationTests/assertions'
import path from 'path'

const log = logger('files')

const crypto = new Crypto()

global.crypto = crypto

describe('send message - users are online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>

  const timeout = 1_940_000

  const image: FileContent = {
    path: `${path.resolve()}/assets/photo.jpeg`,
    name: 'photo',
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

  it('Owner creates community', async () => {
    console.log('SEND FILES - 1')
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  it('Users joins community', async () => {
    console.log('SEND FILES - 2')
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })
  })

  it('Owner and user received certificates', async () => {
    console.log('SEND FILES - 3')
    await assertReceivedCertificates('owner', 2, timeout, owner.store)
    await assertReceivedCertificates('userOne', 2, timeout, userOne.store)
  })

  it('User replicated channel and subscribed to it', async () => {
    console.log('SEND FILES - 4')
    await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
    await assertReceivedChannelsAndSubscribe('userOne', 1, timeout, userOne.store)
  })

  it('user sends image to general channel', async () => {
    console.log('SEND FILES - 5')
    log(`Image ${JSON.stringify(image)}`)
    const payload: SendImage = {
      file: image,
      store: owner.store
    }
    await sendImage(payload)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 30000))
  })

  it('userOne replicated image', async () => {
    console.log('SEND FILES - 6')
    await assertReceivedImages('userOne', 1, timeout, userOne.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 30000))
  })

  it('userOne downloaded image', async () => {
    console.log('SEND FILES - 7')
    await assertDownloadedImage('userOne', image.name + image.ext, timeout, userOne.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 30000))
  })
})

// describe('send files - image is being redistributed (users going offline)', () => {
//   let owner: AsyncReturnType<typeof createApp>
//   let userOne: AsyncReturnType<typeof createApp>
//   let userTwo: AsyncReturnType<typeof createApp>

//   let userTwoOldState: Partial<ReturnType<typeof owner.store.getState>>

//   let userTwoDataPath: string

//   const timeout = 940_000

//   const image: FileContent = {
//     path: `${path.resolve()}/assets/test-image.jpeg`,
//     name: 'test-image',
//     ext: '.jpeg'
//   }

//   beforeAll(async () => {
//     owner = await createApp()
//     userOne = await createApp()
//     userTwo = await createApp()
//   })

//   afterAll(async () => {
//     await userOne.manager.closeAllServices()
//     await userTwo.manager.closeAllServices()
//   })

//   it('Owner creates community', async () => {
//     await createCommunity({ userName: 'Owner', store: owner.store })
//   })

//   it('Two users join community', async () => {
//     const ownerData = getCommunityOwnerData(owner.store)

//     await joinCommunity({
//       ...ownerData,
//       store: userOne.store,
//       userName: 'username1',
//       expectedPeersCount: 2
//     })

//     await joinCommunity({
//       ...ownerData,
//       store: userTwo.store,
//       userName: 'username2',
//       expectedPeersCount: 3
//     })
//   })

//   it('Owner and users received certificates', async () => {
//     await assertReceivedCertificates('owner', 3, timeout, owner.store)
//     await assertReceivedCertificates('userOne', 3, timeout, userOne.store)
//     await assertReceivedCertificates('userTwo', 3, timeout, userTwo.store)
//   })

//   it('Users replicated channel and subscribed to it', async () => {
//     await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
//     await assertReceivedChannelsAndSubscribe('userOne', 1, timeout, userOne.store)
//     await assertReceivedChannelsAndSubscribe('userTwo', 1, timeout, userTwo.store)
//   })

//   it('UserTwo goes offline', async () => {
//     userTwoOldState = storePersistor(userTwo.store.getState())
//     userTwoDataPath = userTwo.appPath
//     await userTwo.manager.closeAllServices()
//   })

//   it('Owner sends image, while UserTwo is offline', async () => {
//     await sendImage({
//       file: image,
//       store: owner.store
//     })
//   })

//   it('UserOne replicated and downloaded the image', async () => {
//     await assertReceivedImages('userOne', 1, 360_000, userOne.store)
//     await assertDownloadedImage('userOne', image.name + image.ext, 360_000, userOne.store)
//   })

//   it('Owner goes offline', async () => {
//     await owner.manager.closeAllServices()
//   })

//   it('UserTwo comes back online', async () => {
//     userTwo = await createApp(userTwoOldState, userTwoDataPath)
//   })

//   it('UserTwo replicated and downloaded the image', async () => {
//     await assertReceivedImages('userTwo', 1, 960_000, userTwo.store)
//     await assertDownloadedImage('userTwo', image.name + image.ext, 960_000, userTwo.store)
//   })
// })
