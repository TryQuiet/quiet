import { produce } from 'immer'
import * as R from 'ramda'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import selectors from '../selectors/messagesQueue'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import appSelectors from '../selectors/app'
import { messageToTransfer } from '../../zbay/messages'
import notificationsHandlers from './notifications'
import appHandlers from './app'
import { errorNotification } from './utils'
import { getClient } from '../../zcash'
import { actionTypes } from '../../../shared/static'
import { DisplayableMessage } from '../../zbay/messages.types'

import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

import { ActionsType, PayloadType } from './types'

export const DEFAULT_DEBOUNCE_INTERVAL = 2000
export class MessagesQueue {
  channelId: string = ''
  message?: DisplayableMessage

  constructor(values?: Partial<MessagesQueue>) {
    Object.assign(this, values);
  }
}

export type MessagesQueueStore = MessagesQueue[]

export const initialState: MessagesQueue[] = []

export type MessagesQueueActions = ActionsType<typeof actions>;

const addMessage = createAction<{ channelId: string; message: DisplayableMessage; key: string }, { message: DisplayableMessage; channelId: string }>(
  actionTypes.ADD_PENDING_MESSAGE,
  ({ message, channelId }) => {
    const messageDigest = crypto.createHash('sha256')
    const messageEssentials = R.pick(['type', 'sender', 'signature'])(message)
    return {
      key: messageDigest
        .update(
          JSON.stringify({
            ...messageEssentials,
            channelId
          })
        )
        .digest('hex'),
      message,
      channelId
    }
  }
)
const removeMessage = createAction<number>(actionTypes.REMOVE_PENDING_MESSAGE)

export const actions = {
  addMessage,
  removeMessage
}

class Store { }
interface IThunkActionWithMeta<R, S, E, A extends Action> extends ThunkAction<R, S, E, A> {
  meta?: {
    debounce: {
      time: number,
      key: string,
    }
  }
}

type ZbayThunkAction<ReturnType> = IThunkActionWithMeta<ReturnType, Store, unknown, Action<string>>

const _sendPendingMessages = (): ZbayThunkAction<void> => async (dispatch, getState) => {
  const lock = appSelectors.messageQueueLock(getState())
  const messages = Array.from(Object.values(selectors.queue(getState())))
  if (lock === false) {
    await dispatch(appHandlers.actions.lockMessageQueue())
  } else {
    if (messages.length !== 0) {
      dispatch(sendPendingMessages())
    }
    return
  }
  const donation = identitySelectors.donation(getState())
  await Promise.all(
    messages
      .map(async (msg, key) => {
        const channel = channelsSelectors.channelById(msg.channelId)(getState())
        const identityAddress = identitySelectors.address(getState())
        const transfer = await messageToTransfer({
          message: msg.message,
          address: channel.address,
          identityAddress,
          donation
        })
        try {
          await getClient().payment.send(transfer)
        } catch (err) {
          dispatch(
            notificationsHandlers.actions.enqueueSnackbar(
              errorNotification({
                message:
                  "Couldn't send the message, please check node connection."
              })
            )
          )
          return
        }
        dispatch(removeMessage(key))
      })
      .values()
  )
  await dispatch(appHandlers.actions.unlockMessageQueue())
}



export const sendPendingMessages = (debounce = null) => {
  const thunk = _sendPendingMessages()
  thunk.meta = {
    debounce: {
      time:
        debounce !== null
          ? debounce
          : process.env.ZBAY_DEBOUNCE_MESSAGE_INTERVAL ||
          DEFAULT_DEBOUNCE_INTERVAL,
      key: 'SEND_PENDING_DRIRECT_MESSAGES'
    }
  }
  return thunk
}

const addMessageEpic = payload => async (dispatch, getState) => {
  dispatch(addMessage(payload))
  await dispatch(sendPendingMessages())
}

export const epics = {
  addMessage: addMessageEpic,
  resetMessageDebounce: sendPendingMessages
}

export const reducer = handleActions<MessagesQueueStore, PayloadType<MessagesQueueActions>>(
  {
    [addMessage.toString()]: (state, { payload: { channelId, message, key } }: MessagesQueueActions['addMessage']) =>
      produce(state, (draft) => {
        draft[key] = new MessagesQueue({
          channelId,
          message
        })
      }),
    [removeMessage.toString()]: (state, { payload: key }: MessagesQueueActions['removeMessage']) => produce(state, (draft) => {
      delete draft[key]
    })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
