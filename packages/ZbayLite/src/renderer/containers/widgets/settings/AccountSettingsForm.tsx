import React from 'react'
import { useSelector } from 'react-redux'

import AccountSettingsFormComponent from '../../../components/widgets/settings/AccountSettingsForm'
import { identity } from '@zbayapp/nectar'

const useData = () => {
  const data = {
    user: useSelector(identity.selectors.currentIdentity)
  }
  return data
}

export const AccountSettingsForm = () => {
  const { user } = useData()

  return (
    <AccountSettingsFormComponent
      user={user}
    />
  )
}

export default AccountSettingsForm
