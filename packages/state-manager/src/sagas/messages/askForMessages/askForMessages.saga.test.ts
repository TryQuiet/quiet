import { TestApi, testSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import {
  messagesActions
} from '../messages.slice'
import { AskForMessagesPayload } from '../messages.types'
import { askForMessagesSaga } from './askForMessages.saga'

describe('askForMessagesSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket
  const askForMessagesPayload: AskForMessagesPayload = {
    peerId: '',
    communityId: '',
    channelId: '',
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
