import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import SendMessagePopoverComponent from '../../../components/widgets/channels/SendMessagePopover'
// import identitySelectors from '../../../store/selectors/identity'
// import userSelectors from '../../../store/selectors/users'
import directMessages from '../../../store/handlers/contacts'
import { IUser } from '../../../store/handlers/directMessages'
import directMessagesSelectors from '../../../store/selectors/directMessages'

interface useSendMessagePopoverDataReturnType {
  users: any[]
  waggleUsers: {
    [key: string]: IUser
  }
}

export const useSendMessagePopoverData = (): useSendMessagePopoverDataReturnType => {
  const data = {
    // identityId: identitySelectors.id(state),
    // identityId: 'id',
    // users: userSelectors.users(state),
    users: [],
    waggleUsers: useSelector(directMessagesSelectors.users)
  }
  return data
}

export const useSendMessagePopoverActions = () => {
  const dispatch = useDispatch()

  const createNewContact = useCallback((contact) => {
    dispatch(directMessages.epics.createVaultContact(contact))
  }, [dispatch])

  return { createNewContact }
}

export const SendMessagePopover = ({ username, anchorEl, handleClose }) => {
  const { users, waggleUsers } = useSendMessagePopoverData()
  const { createNewContact } = useSendMessagePopoverActions()

  return (
    <SendMessagePopoverComponent
      username={username}
      anchorEl={anchorEl}
      users={users}
      waggleUsers={waggleUsers}
      createNewContact={createNewContact}
      handleClose={handleClose}
      isUnregistered={false}
    />
  )
}

export default SendMessagePopover
