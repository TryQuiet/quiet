import BigNumber from 'bignumber.js'

import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import { messageType } from '../../zbay/messages'
import { messages } from '../../zbay'
import { getClient } from '../../zcash'
import notificationsHandlers from './notifications'
import { errorNotification, successNotification } from './utils'

const handleSend = ({ values }) => async (dispatch, getState) => {
  const data = {
    tag: values.tag,
    background: values.background.toString(),
    title: values.title,
    provideShipping: values.shippingInfo ? '1' : '0',
    amount: values.usd,
    description: values.description
  }
  const identityAddress = identitySelectors.address(getState())
  const channel = channelSelectors.data(getState()).toJS()
  const privKey = identitySelectors.signerPrivKey(getState())
  const message = messages.createMessage({
    messageData: {
      type: messageType.AD,
      data: data,
      spent: new BigNumber('0.0001')
    },
    privKey
  })
  const transfer = await messages.messageToTransfer({
    message,
    address: channel.address,
    identityAddress
  })
  try {
    await getClient().payment.send(transfer)
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification('Advert successfully posted')
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
  handleSend
}

export default {
  epics
}
