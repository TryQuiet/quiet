import notificationsHandlers from './notifications'
import client from '../../zcash'
import identitySelectors from '../selectors/identity'
import nodeSelectors from '../selectors/node'
import { messages as zbayMessages } from '../../zbay'
import channelSelectors from '../selectors/channel'
import { errorNotification, successNotification } from './utils'
import { messageType, moderationActionsType } from '../../../shared/static'
import channels from '../../zcash/channels'

const handleModerationAction = ({ moderationType, moderationTarget }) => async (
  dispatch,
  getState
) => {
  const channel = channelSelectors.data(getState())
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
    address: channel.address
  })
  try {
    const txid = await client.sendTransaction(transfer)
    if (txid.error) {
      throw new Error(txid.error)
    }
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Successfully sent instruction to channel'
        })
      )
    )
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: "Couldn't send the message, please check node connection."
        })
      )
    )
  }
}
const updateChannelSettings = values => async (dispatch, getState) => {
  const channel = channelSelectors.data(getState())
  const network = nodeSelectors.network(getState())
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = zbayMessages.createMessage({
    messageData: {
      type: messageType.CHANNEL_SETTINGS_UPDATE,
      data: {
        updateChannelDescription: values.updateChannelDescription,
        updateChannelAddress: channel.address,
        updateMinFee: values.updateMinFee ? values.amountZec.toString() : '0',
        updateOnlyRegistered: values.updateOnlyRegistered ? '1' : '0'
      }
    },
    privKey
  })
  const transfer = await zbayMessages.messageToTransfer({
    message,
    address: channel.address
  })
  const transferToPublic = await zbayMessages.messageToTransfer({
    message,
    address: channels.channelOfChannels[network].address
  })
  const transfers = [transfer, transferToPublic]
  try {
    await client.sendTransaction(transfers)
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({
          message: 'Successfully sent instruction to channel'
        })
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
  handleModerationAction,
  updateChannelSettings
}

export default {
  epics,
  moderationActionsType
}
