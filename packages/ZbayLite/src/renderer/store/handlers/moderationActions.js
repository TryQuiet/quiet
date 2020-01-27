
import notificationsHandlers from './notifications'
import { getClient } from '../../zcash'
import identitySelectors from '../selectors/identity'
import { messages as zbayMessages } from '../../zbay'
import channelSelectors from '../selectors/channel'
import { errorNotification, successNotification } from './utils'
import { messageType } from '../../../shared/static'

export const moderationActionsType = {
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',
  ADD_MOD: 'ADD_MOD',
  REMOVE_MOD: 'REMOVE_MOD',
  REMOVE_CHANNEL: 'REMOVE_CHANNEL'
}

const handleModerationAction = ({ moderationType, moderationTarget }) => async (
  dispatch,
  getState
) => {
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState()).toJS()
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = zbayMessages.createMessage({
    messageData: {
      type: messageType.MODERATION,
      data: {
        moderationType,
        moderationTarget
      }
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message,
    address: channel.address,
    identityAddress
  })
  try {
    await getClient().payment.send(transfer)
    // await dispatch(
    //   operationsHandlers.epics.observeOperation({
    //     opId,
    //     type: operationTypes.pendingMessage,
    //     meta: {
    //       channelId: channel.id,
    //       message: message
    //     }
    //   })
    // )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: 'Successfully sent inctruction to channel' })
      )
    )
  } catch (err) {
    notificationsHandlers.actions.enqueueSnackbar(
      dispatch(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
  }
}

export const epics = {
  handleModerationAction
}

export default {
  epics,
  moderationActionsType
}
