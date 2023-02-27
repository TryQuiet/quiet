import { Crypto } from '@peculiar/webcrypto'
import { createApp } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { FileContent } from '@quiet/state-manager'
import logger from '../logger'
import { assertReceivedCertificates } from '../testUtils/assertions'
import path from 'path'
import { createCommunity, getCommunityOwnerData, joinCommunity, SendImage, sendImage } from './appActions'
import { assertReceivedChannelsAndSubscribe, assertReceivedImages, assertDownloadedImage } from './assertions'

const log = logger('files')

const crypto = new Crypto()

global.crypto = crypto

describe('send message - users are online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>

  const timeout = 940_000

  const image: FileContent = {
    path: `${path.resolve()}/assets/medium-file4.jpeg`,
    name: 'medium-file4',
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
  })

  it('userOne replicated image', async () => {
    console.log('SEND FILES - 6')
    await assertReceivedImages('userOne', 1, timeout, userOne.store)
  })

  it('userOne downloaded image', async () => {
    console.log('SEND FILES - 7')
    await assertDownloadedImage('userOne', image.name + image.ext, timeout, userOne.store)
  })
})
