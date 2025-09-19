import React from 'react'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

import { About } from '../widgets/Settings/About'
import { Notifications } from './Tabs/Notifications/Notifications'
import { Invite } from './Tabs/Invite/Invite'
import { QRCode } from './Tabs/QRCode/QRCode'
import { LeaveCommunity } from './Tabs/LeaveCommunity/LeaveCommunity'

import SettingsComponent from './SettingsComponent'
import { DebugInfoComponent } from '../debugInfo/debugInfoComponent'

const Settings = () => {
  const modal = useModal(ModalName.accountSettingsModal)

  const tabs: Record<string, React.ComponentType<any>> = {
    about: About,
    notifications: Notifications,
    invite: Invite,
    qrcode: QRCode,
    leaveCommunity: LeaveCommunity,
  }

  if (process.env.NODE_ENV === 'development' || process.env.IS_E2E === 'true') {
    tabs.debug = DebugInfoComponent
  }

  const leaveCommunityModal = useModal(ModalName.leaveCommunity)

  const isWindows = process.platform === 'win32'

  return <SettingsComponent tabs={tabs} leaveCommunityModal={leaveCommunityModal} {...modal} isWindows={isWindows} />
}

export default Settings
