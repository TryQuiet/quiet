import { shell } from 'electron'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../shared/setupTests'
import { prepareStore } from '../../testUtils/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { call, fork } from 'typed-redux-saga'
import { publicChannels, NotificationsSounds, MessageType, FileMetadata } from '@quiet/state-manager'
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

    const channel = 'sailing'

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: channel,
      sound: NotificationsSounds.splat
    }

    // Verify current channel is 'general
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe('general')

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.Basic, channel)
      const onClick = notification.onclick
      expect(onClick).not.toBeNull()
      if(onClick) yield* call(onClick, new Event(''))
    })

    // Confirm current channel address has changed
    expect(publicChannels.selectors.currentChannelAddress(store.getState())).toBe(channel)
  })

  it('opens file explorer', async () => {
    const socket: MockedSocket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    const { runSaga } = await prepareStore({}, socket)

    const channel = 'sailing'

    const media: FileMetadata = {
      cid: 'cid',
      name: 'file',
      ext: 'ext',
      path: 'path/file.ext',
      message: {
        id: 'id',
        channelAddress: channel
      }
    }

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: channel,
      sound: NotificationsSounds.splat
    }

    const spy = jest.spyOn(shell, 'showItemInFolder')

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.File, channel, media)
      const onClick = notification.onclick
      expect(onClick).not.toBeNull()
      if(onClick) yield* call(onClick, new Event(''))
    })

    expect(spy).toHaveBeenCalledWith(media.path)
  })
})
