import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal, actionCreators } from '../../../store/handlers/modals'
import SendMoneyModalComponent from '../../../components/ui/sendMoneySeparate/SendMoneyMain'
import { rate } from '../../../store/selectors/rates'
import identitySelector from '../../../store/selectors/identity'
import directMessages from '../../../store/handlers/contacts'
import transfers from '../../../store/handlers/directMessagesQueue'
import modalsSelectors from '../../../store/selectors/modals'
import userSelectors from '../../../store/selectors/users'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  rateZec: 1 / rate('usd')(state),
  balanceZec: identitySelector.balance('zec')(state),
  userData: identitySelector.data(state),
  shippingData: identitySelector.shippingData(state),
  users: userSelectors.users(state),
  targetRecipientAddress: modalsSelectors.payload('sendMoney')(state),
  nickname: userSelectors.registeredUser(
    identitySelector.signerPubKey(state)
  )(state)
    ? userSelectors
      .registeredUser(identitySelector.signerPubKey(state))(state)
      .get('nickname')
    : ''
})

export const SendMoneyModal = props => {
  return <SendMoneyModalComponent {...props} />
}
export const mapDispatchToProps = dispatch => bindActionCreators({
  sendMessageHandler: directMessages.epics.sendDirectMessage,
  openSentFundsModal: (payload) => actionCreators.openModal('sentFunds', payload)(),
  sendPlainTransfer: (payload) => transfers.epics.sendPlainTransfer(payload)
}, dispatch)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('sendMoneySeparate'),
  React.memo
)(SendMoneyModal)
