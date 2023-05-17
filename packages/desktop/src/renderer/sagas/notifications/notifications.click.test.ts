import { shell } from 'electron'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../shared/setupTests'
import { prepareStore } from '../../testUtils/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { call, fork } from 'typed-redux-saga'
import {
  publicChannels,
  NotificationsSounds,
  MessageType,
  FileMetadata
} from '@quiet/state-manager'
import {
  createNotification,
  handleNotificationActions,
  NotificationData
} from './notifications.saga'
import { generateChannelAddress } from '@quiet/common'

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

jest.mock('electron', () => {
  return {
    shell: {
      showItemInFolder: jest.fn()
    }
  }
})

beforeAll(async () => {
  setupCrypto()
})

describe('clicking in notification', () => {
  it('changes active channel', async () => {
    const socket: MockedSocket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    const { store, runSaga } = await prepareStore({}, socket)

    const generalAddress = generateChannelAddress('general')
    const sailingAddress = generateChannelAddress('sailing')

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: sailingAddress,
      sound: NotificationsSounds.splat
    }

    store.dispatch(publicChannels.actions.setCurrentChannel({ channelAddress: generalAddress }))

    // Verify current channel is 'general
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe(generalAddress)

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.Basic, sailingAddress)
      yield* call(notification.onclick, new Event(''))
    })

    // Confirm current channel address has changed
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe(sailingAddress)
  })

  it('opens file explorer', async () => {
    const socket: MockedSocket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    const { runSaga } = await prepareStore({}, socket)

    const sailingAddress = generateChannelAddress('sailing')

    const media: FileMetadata = {
      cid: 'cid',
      name: 'file',
      ext: 'ext',
      path: 'path/file.ext',
      message: {
        id: 'id',
        channelAddress: sailingAddress
      }
    }

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: sailingAddress,
      sound: NotificationsSounds.splat
    }

    const spy = jest.spyOn(shell, 'showItemInFolder')

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.File, sailingAddress, media)
      yield* call(notification.onclick, new Event(''))
    })

    expect(spy).toHaveBeenCalledWith(media.path)
  })
})
