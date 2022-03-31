import { prepareStore } from '../../testUtils/prepareStore'
import rootSaga from '../../sagas/index.saga'
import { communities, getFactory, identity, IncomingMessages, publicChannels, users } from '@quiet/nectar'
import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'
import { waitFor } from '@testing-library/react'
import { SagaMonitor } from 'redux-saga'
const originalNotification = window.Notification
const mockNotification = jest.fn()
const notification = jest.fn().mockImplementation(() => { return mockNotification })
// @ts-expect-error
window.Notification = notification

jest.mock('../../../shared/sounds', () => ({
  // @ts-expect-error
  ...jest.requireActual('../../../shared/sounds'),
  soundTypeToAudio: {
    pow: {
      play: jest.fn()
    }
  }
}))
jest.mock('electron', () => {
  return {
    remote:
    {
      BrowserWindow: {
        getAllWindows: () => {
          return [{
            show: jest.fn(),
            isFocused: jest.fn()
          }]
        }
      }
    }
  }
})

let incomingMessages: IncomingMessages
let store
let publicChannel2

beforeAll(async () => {
  setupCrypto()
  store = await prepareStore()
  const factory = await getFactory(store.store)

  const community1 = await factory.create<
  ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  publicChannel2 = await factory.create<
  ReturnType<typeof publicChannels.actions.addChannel>['payload']
  >('PublicChannel', { communityId: community1.id })

  const alice = await factory.create<
  ReturnType<typeof identity.actions.addNewIdentity>['payload']
  >('Identity', { id: community1.id, nickname: 'alice' })

  const parsedCert = parseCertificate(alice.userCertificate)
  const userPubKey = await keyFromCertificate(parsedCert)

  const senderPubKey = Object.keys(users.selectors.certificatesMapping(store.store.getState()))
    .find((pubKey) => pubKey !== userPubKey)

  incomingMessages = {
    messages: [{
      id: 'id',
      type: 1,
      message: 'message',
      createdAt: 1000000,
      channelAddress: publicChannel2.channel.address,
      signature: 'signature',
      pubKey: senderPubKey
    }],
    communityId: '1'
  }
})

afterAll(() => {
  window.Notification = originalNotification
})

describe('displayMessageNotificationSaga test', () => {
  it('clicking in notification takes you to message in relevant channel and ends emit', async () => {
    store.runSaga(rootSaga)
    store.store.dispatch(publicChannels.actions.incomingMessages(incomingMessages))

    // simulate click on notification
    // @ts-expect-error
    mockNotification.onclick()
    const isTakeEveryResolved = store.sagaMonitor.isEffectResolved('takeEvery(channel, bridgeAction)')

    expect(publicChannels.selectors.currentChannel(store.store.getState()).address).toBe(publicChannel2.channel.address)
    expect(isTakeEveryResolved).toBeTruthy()
  })

  it('closing notification ends emit', async () => {
    store.runSaga(rootSaga)
    store.store.dispatch(publicChannels.actions.incomingMessages(incomingMessages))

    // simulate close notification
    // @ts-expect-error
    mockNotification.onclose()
    const isTakeEveryResolved = store.sagaMonitor.isEffectResolved('takeEvery(channel, bridgeAction)')

    expect(isTakeEveryResolved).toBeTruthy()
  })
})
