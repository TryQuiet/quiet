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

describe('Medium File', () => {
  let owner: AsyncReturnType<typeof createApp>
  let userOne: AsyncReturnType<typeof createApp>

  const timeout = 3_940_000

  const image: FileContent = {
    path: `${path.resolve()}/assets/medium-file2.jpeg`,
    name: 'medium-file2',
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
    await createCommunity({ userName: 'Owner', store: owner.store })
  })

  it('Users joins community', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2
    })
  })

  it('Owner and user received certificates', async () => {
    await assertReceivedCertificates('owner', 2, timeout, owner.store)
    await assertReceivedCertificates('userOne', 2, timeout, userOne.store)
  })

  it('User replicated channel and subscribed to it', async () => {
    await assertReceivedChannelsAndSubscribe('owner', 1, timeout, owner.store)
    await assertReceivedChannelsAndSubscribe('userOne', 1, timeout, userOne.store)
  })

  it('user sends image to general channel', async () => {
    log(`Image ${JSON.stringify(image)}`)
    const payload: SendImage = {
      file: image,
      store: owner.store
    }
    await sendImage(payload)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 30000))
  })

  it('userOne replicated image', async () => {
    await assertReceivedImages('userOne', 1, timeout, userOne.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 90000))
  })

  it('userOne downloaded image', async () => {
    await assertDownloadedImage('userOne', image.name + image.ext, timeout, userOne.store)
  })
})
