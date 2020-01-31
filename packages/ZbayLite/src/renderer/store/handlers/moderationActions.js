import notificationsHandlers from './notifications'
import { getClient } from '../../zcash'
import identitySelectors from '../selectors/identity'
import { messages as zbayMessages } from '../../zbay'
import channelSelectors from '../selectors/channel'
import channelsSelectors from '../selectors/channels'
import publicChannelsSelectors from '../selectors/publicChannels'
import { errorNotification, successNotification } from './utils'
import { messageType, moderationActionsType } from '../../../shared/static'
import { packMemo } from '../../zbay/transit'

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
const updateChannelSettings = values => async (dispatch, getState) => {
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState()).toJS()
  const publicChannelsChannel = channelsSelectors
    .publicChannels(getState())
    .toJS()
  const publicChannels = publicChannelsSelectors.publicChannels(getState())

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
  const amounts = []
  let memo = await packMemo(message)
  const transferToChannel = {
    address: channel.address,
    amount: '0',
    memo
  }
  amounts.push(transferToChannel)
  if (publicChannels.find(ch => ch.address === channel.address)) {
    const transferToPublicChannels = {
      address: publicChannelsChannel.address,
      amount: '0',
      memo
    }
    amounts.push(transferToPublicChannels)
  }
  const transfer = { from: identityAddress, amounts: amounts }
  try {
    await getClient().payment.send(transfer)
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
