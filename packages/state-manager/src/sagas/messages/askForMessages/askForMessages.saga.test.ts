import { TestApi, testSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import {
  messagesActions
} from '../messages.slice'
import { AskForMessagesPayload, SocketActionTypes } from '@quiet/types'
import { askForMessagesSaga } from './askForMessages.saga'

describe('askForMessagesSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket
  const askForMessagesPayload: AskForMessagesPayload = {
    peerId: '',
    communityId: '',
    channelAddress: '',
    ids: []
  }
  const saga: TestApi = testSaga(
    askForMessagesSaga,
    socket,
    messagesActions.askForMessages(askForMessagesPayload)
  )

  beforeEach(() => {
    saga.restart()
  })

  test('should be defined', () => {
    saga
      .next()
      .apply(socket, socket.emit, [SocketActionTypes.ASK_FOR_MESSAGES, askForMessagesPayload])
      .next()
      .isDone()
  })
})
