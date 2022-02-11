import React from 'react'
import { useDispatch } from 'react-redux'

import BlockedUsersComponent from '../../../components/widgets/settings/BlockedUsers'

export const useBlockedUsersData = () => {
  const data = {
    users: [],
    // blockedUsers: useSelector(notificationCenterSelector.blockedUsers) ?????????????
    blockedUsers: []
  }
  return data
}

export const BlockedUsers = () => {
  const { users, blockedUsers } = useBlockedUsersData()

  return <BlockedUsersComponent
    users={users}
    blockedUsers={blockedUsers}
  />
}

export default BlockedUsers
