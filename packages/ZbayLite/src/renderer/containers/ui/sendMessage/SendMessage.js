import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'

import { withModal, actionCreators } from '../../../store/handlers/modals'
import SendMessageModalComponent from '../../../components/ui/sendMessage/SendMessageMain'
import identitySelector from '../../../store/selectors/identity'
import directMessages from '../../../store/handlers/contacts'
import transfers from '../../../store/handlers/directMessagesQueue'
import userSelectors from '../../../store/selectors/users'

export const mapStateToProps = state => ({
  balanceZec: identitySelector.balance('zec')(state),
  userData: identitySelector.data(state),
  users: userSelectors.users(state),
  nickname: userSelectors.registeredUser(
    identitySelector.signerPubKey(state)
  )(state)
    ? userSelectors
      .registeredUser(identitySelector.signerPubKey(state))(state)
      .get('nickname')
    : ''
})

export const SendMessageModal = props => {
  return <SendMessageModalComponent {...props} />
}
export const mapDispatchToProps = dispatch => bindActionCreators({
  sendMessageHandler: directMessages.epics.sendDirectMessage,
  createNewContact: (contact) => directMessages.epics.createVaultContact(contact),
  sendPlainTransfer: (payload) => transfers.epics.sendPlainTransfer(payload),
  openSentFundsModal: (payload) => actionCreators.openModal('sentFunds', payload)()
}, dispatch)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
  withModal('newMessageSeparate'),
  React.memo
)(SendMessageModal)
