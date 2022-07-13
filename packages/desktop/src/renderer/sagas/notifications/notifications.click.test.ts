import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../shared/setupTests'
import { prepareStore } from '../../testUtils/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { call, fork } from 'typed-redux-saga'
import { publicChannels, NotificationsSounds } from '@quiet/state-manager'
import {
  createNotification,
  handleNotificationActions,
  NotificationData
} from './notifications.saga'

const notification = jest.fn().mockImplementation(() => {
  return jest.fn()
})

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

beforeAll(async () => {
  setupCrypto()
})

describe('clicking in notification', () => {
  it('changes active channel', async () => {
    const socket: MockedSocket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    const { store, runSaga } = await prepareStore({}, socket)

    const channelAddress = 'sailing'

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: channelAddress,
      sound: NotificationsSounds.splat
    }

    // Verify current channel is 'general
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe('general')

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, channelAddress)
      yield* call(notification.onclick, new Event(''))
    })

    // Confirm current channel address has changed
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe(channelAddress)
  })
})
