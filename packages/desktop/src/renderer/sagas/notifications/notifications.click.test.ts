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
import { generateChannelId } from '@quiet/common'

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

    const generalId = generateChannelId('general')
    const sailingId = generateChannelId('sailing')

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: sailingId,
      sound: NotificationsSounds.splat
    }

    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: generalId }))

    // Verify current channel is 'general
    expect(publicChannels.selectors.currentchannelId(store.getState())).toBe(generalId)

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.Basic, sailingId)
      yield* call(notification.onclick, new Event(''))
    })

    // Confirm current channel address has changed
    expect(publicChannels.selectors.currentchannelId(store.getState())).toBe(sailingId)
  })

  it('opens file explorer', async () => {
    const socket: MockedSocket = new MockedSocket()
    ioMock.mockImplementation(() => socket)

    const { runSaga } = await prepareStore({}, socket)

    const sailingId = generateChannelId('sailing')

    const media: FileMetadata = {
      cid: 'cid',
      name: 'file',
      ext: 'ext',
      path: 'path/file.ext',
      message: {
        id: 'id',
        channelId: sailingId
      }
    }

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: sailingId,
      sound: NotificationsSounds.splat
    }

    const spy = jest.spyOn(shell, 'showItemInFolder')

    runSaga(function* (): Generator {
      const notification = yield* call(createNotification, notificationData)
      yield* fork(handleNotificationActions, notification, MessageType.File, sailingId, media)
      yield* call(notification.onclick, new Event(''))
    })

    expect(spy).toHaveBeenCalledWith(media.path)
  })
})
