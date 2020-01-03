import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import JoinChannelModal from '../../../components/widgets/channels/JoinChannelModal'
import publicChannels from '../../../store/selectors/publicChannels'
import usersSelector from '../../../store/selectors/users'
import channelHandlers from '../../../store/handlers/channel'
import notificationsHandlers from '../../../store/handlers/notifications'

export const mapStateToProps = state => ({
  publicChannels: publicChannels.publicChannels(state),
  users: usersSelector.users(state)
})
export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      joinChannel: channelHandlers.epics.linkChannelRedirect,
      showNotification: notificationsHandlers.actions.enqueueSnackbar
    },
    dispatch
  )

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  React.memo,
  withModal('joinChannel')
)(JoinChannelModal)
