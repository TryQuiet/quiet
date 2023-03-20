import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { identity } from '@quiet/state-manager'

import AccountSettingsComponent from './AccountSettingsComponent'

const useData = () => {
  const data = {
    user: useSelector(identity.selectors.currentIdentity)
  }
  return data
}

export const AccountSettings: FC = () => {
  const { user } = useData()

  return (
    <AccountSettingsComponent
      user={user}
    />
  )
}
