import React, { FC, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { network, users } from '@quiet/state-manager'

import { CommunityMembershipComponent } from './CommunityMembership.component'
import { createLogger } from '../../../../logger'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../../hooks/useContextMenu'
import { MenuName } from '../../../../../const/MenuNames.enum'

const LOGGER = createLogger('CommunityMembership')

export const CommunityMembership: FC<{ handleClose: () => void; currentTab: string }> = ({ currentTab }) => {
  LOGGER.debug('Opening community membership settings tab')

  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const connectedPeers = useSelector(network.selectors.connectedPeers)
  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const [tabOpen, setTabOpen] = useState<boolean>(false)

  const openUserProfilePanel = (userProfile: UserProfile | undefined) => {
    if (userProfile) {
      userProfileContextMenu.handleOpen({ userProfile })
    } else {
      userProfileContextMenu.handleOpen()
    }
  }

  useEffect(() => {
    if (currentTab == 'communityMembership') {
      setTabOpen(true)
    } else {
      setTabOpen(false)
    }
  }, [currentTab])

  return (
    <CommunityMembershipComponent
      userProfiles={userProfiles}
      me={me}
      connectedPeers={connectedPeers}
      openUserProfilePanel={openUserProfilePanel}
      open={tabOpen}
    />
  )
}
