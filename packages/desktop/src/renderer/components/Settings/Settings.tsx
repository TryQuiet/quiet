import React from 'react'
import { useSelector } from 'react-redux'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

import { communities } from '@quiet/state-manager'

import { About } from '../widgets/Settings/About'
import { AccountSettings } from './Tabs/AccountSettings/AccountSettings'
import { Notifications } from './Tabs/Notifications/Notifications'
import { Invite } from './Tabs/Invite/Invite'
import { QRCode } from './Tabs/QRCode/QRCode'

import SettingsComponent from './SettingsComponent'

const Settings = () => {
  const modal = useModal(ModalName.accountSettingsModal)

  const community = useSelector(communities.selectors.currentCommunity)

  const isOwner = Boolean(community?.CA)

  const tabs = {
    about: About,
    account: AccountSettings,
    notifications: Notifications,
    invite: Invite,
    qrcode: QRCode
  }

  const leaveCommunityModal = useModal(ModalName.leaveCommunity)

  const isWindows = process.platform === 'win32'

  return (
    <SettingsComponent
      isOwner={isOwner}
      tabs={tabs}
      leaveCommunityModal={leaveCommunityModal}
      {...modal}
      isWindows={isWindows}
    />
  )
}

export default Settings
