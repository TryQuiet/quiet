import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import NewMessageModal from '../../../components/widgets/channels/NewMessageModal'
import usersSelector from '../../../store/selectors/users'
import contactsHandlers from '../../../store/handlers/contacts'
import notificationsHandlers from '../../../store/handlers/notifications'

export const mapStateToProps = state => ({
  users: usersSelector.users(state)
})
export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      sendMessage: contactsHandlers.epics.sendDirectMessage,
      showNotification: notificationsHandlers.actions.enqueueSnackbar
    },
    dispatch
  )

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  React.memo,
  withModal('newMessage')
)(NewMessageModal)
