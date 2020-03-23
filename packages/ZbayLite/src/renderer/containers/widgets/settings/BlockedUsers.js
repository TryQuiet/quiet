import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import usersSelector from '../../../store/selectors/users'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import BlockedUsersComponent from '../../../components/widgets/settings/BlockedUsers'
import notificationCenterSelector from '../../../store/selectors/notificationCenter'

export const mapStateToProps = state => ({
  users: usersSelector.users(state),
  blockedUsers: notificationCenterSelector.blockedUsers(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      unblock: notificationCenterHandlers.epics.unblockUserNotification
    },
    dispatch
  )

export const BlockedUsers = props => {
  return <BlockedUsersComponent {...props} />
}

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  BlockedUsers
)
