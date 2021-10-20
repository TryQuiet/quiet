import React from 'react'
import { useDispatch } from 'react-redux'

import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import BlockedUsersComponent from '../../../components/widgets/settings/BlockedUsers'

export const useBlockedUsersData = () => {
  const data = {
    users: [],
    // blockedUsers: useSelector(notificationCenterSelector.blockedUsers) ?????????????
    blockedUsers: []
  }
  return data
}

export const useBlockedUsersActions = () => {
  const dispatch = useDispatch()

  const unblock = (address) => dispatch(notificationCenterHandlers.epics.unblockUserNotification(address))

  return { unblock }
}

export const BlockedUsers = () => {
  const { users, blockedUsers } = useBlockedUsersData()
  const { unblock } = useBlockedUsersActions()

  return <BlockedUsersComponent
    unblock={unblock}
    users={users}
    blockedUsers={blockedUsers}
  />
}

export default BlockedUsers
