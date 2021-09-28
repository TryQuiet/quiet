import React from 'react'
import * as R from 'ramda'
import { useSelector, useDispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { withModal, actionCreators } from '../../../store/handlers/modals'
import SendMessageModalComponent from '../../../components/ui/sendMessage/SendMessageMain'
// import identitySelector from '../../../store/selectors/identity'
import directMessages from '../../../store/handlers/contacts'
// import userSelectors from '../../../store/selectors/users'
import directMessagesSelector from '../../../store/selectors/directMessages'

// import { identity } from '@zbayapp/nectar'

const useData = () => {
  const data = {
    users: useSelector(directMessagesSelector.users),
    nickname: ''
  }
  return data
}

export const SendMessageModal = () => {
  const { users, nickname } = useData()
  const dispatch = useDispatch()

  const createNewContact = contact => dispatch(directMessages.epics.createVaultContact(contact))
  const openSentFundsModal = () => dispatch(actionCreators.openModal('sentFunds')())

  return (
    <SendMessageModalComponent
      // userData={userData}
      users={users}
      nickname={nickname}
      createNewContact={createNewContact}
      openSentFundsModal={openSentFundsModal}
    />
  )
}
export default R.compose(withRouter, withModal('newMessageSeparate'), React.memo)(SendMessageModal)
