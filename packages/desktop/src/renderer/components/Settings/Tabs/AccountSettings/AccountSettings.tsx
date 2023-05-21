import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { identity } from '@quiet/state-manager'

import AccountSettingsComponent from './AccountSettingsComponent'

export const AccountSettings: FC = () => {
  const user = useSelector(identity.selectors.currentIdentity)
  if (!user) return null

  return (
    <AccountSettingsComponent
      user={user}
    />
  )
}
