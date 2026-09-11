import React from 'react'

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'

import { About } from '../widgets/Settings/About'
import { Notifications } from './Tabs/Notifications/Notifications'
import { Attachments } from './Tabs/Attachments/Attachments'
import { Invite } from './Tabs/Invite/Invite'
import { QRCode } from './Tabs/QRCode/QRCode'
import { LeaveCommunity } from './Tabs/LeaveCommunity/LeaveCommunity'

import SettingsComponent from './SettingsComponent'
import { DebugInfoComponent } from '../debugInfo/debugInfoComponent'
import { CommunityMembership } from './Tabs/CommunityMembership/CommunityMembership'

const Settings = () => {
  const modal = useModal(ModalName.accountSettingsModal)

  const tabs: Record<string, React.ComponentType<any>> = {
    about: About,
    notifications: Notifications,
    attachments: Attachments,
    invite: Invite,
    qrcode: QRCode,
    leaveCommunity: LeaveCommunity,
    communityMembership: CommunityMembership,
  }

  if (process.env.NODE_ENV === 'development' || process.env.IS_E2E === 'true') {
    tabs.debug = DebugInfoComponent
  }

  const leaveCommunityModal = useModal(ModalName.leaveCommunity)

  const isWindows = process.platform === 'win32'

  return <SettingsComponent tabs={tabs} leaveCommunityModal={leaveCommunityModal} {...modal} isWindows={isWindows} />
}

export default Settings
